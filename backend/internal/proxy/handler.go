package proxy

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"html"
	"io"
	"net"
	"net/http"
	"net/netip"
	neturl "net/url"
	"strings"
	"time"
)

type Config struct {
	AllowPrivateNetworks bool
	HTMLBodyLimitBytes   int64
	RequestTimeoutSec    int
}

type Handler struct {
	allowPrivateNetworks bool
	client               *http.Client
	htmlBodyLimitBytes   int64
}

func NewHandler(cfg Config) *Handler {
	client := &http.Client{
		Timeout: time.Duration(cfg.RequestTimeoutSec) * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	return &Handler{
		allowPrivateNetworks: cfg.AllowPrivateNetworks,
		client:               client,
		htmlBodyLimitBytes:   cfg.HTMLBodyLimitBytes,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	target := strings.TrimSpace(r.URL.Query().Get("url"))
	if target == "" {
		http.Error(w, "missing url param", http.StatusBadRequest)
		return
	}

	targetURL, err := neturl.Parse(target)
	if err != nil || targetURL.Scheme == "" || targetURL.Host == "" {
		http.Error(w, "invalid url param", http.StatusBadRequest)
		return
	}

	if targetURL.Scheme != "http" && targetURL.Scheme != "https" {
		http.Error(w, "unsupported protocol", http.StatusBadRequest)
		return
	}

	if err := validateDestination(r.Context(), targetURL, h.allowPrivateNetworks); err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, targetURL.String(), nil)
	if err != nil {
		http.Error(w, "failed to build upstream request", http.StatusInternalServerError)
		return
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Accept-Encoding", "identity")

	resp, err := h.client.Do(req)
	if err != nil {
		renderProxyError(w, http.StatusBadGateway, targetURL.String(), err)
		return
	}
	defer resp.Body.Close()

	filteredHeaders := copyHeaders(resp.Header)
	removeBlockedHeaders(filteredHeaders)
	contentType := strings.ToLower(filteredHeaders.Get("Content-Type"))

	if strings.Contains(contentType, "text/html") {
		h.serveHTML(w, resp, filteredHeaders)
		return
	}

	copyResponseHeaders(w.Header(), filteredHeaders)
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (h *Handler) serveHTML(w http.ResponseWriter, resp *http.Response, headers http.Header) {
	body, err := io.ReadAll(io.LimitReader(resp.Body, h.htmlBodyLimitBytes+1))
	if err != nil {
		http.Error(w, "failed to read upstream body", http.StatusBadGateway)
		return
	}

	if int64(len(body)) > h.htmlBodyLimitBytes {
		http.Error(w, "upstream html too large", http.StatusBadGateway)
		return
	}

	finalURL := resp.Request.URL.String()
	baseTag := fmt.Sprintf(`<base href="%s">`, html.EscapeString(finalURL))
	replaced := injectBaseTag(body, baseTag)

	headers.Del("Content-Length")
	headers.Del("Transfer-Encoding")
	copyResponseHeaders(w.Header(), headers)
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(replaced)
}

func injectBaseTag(body []byte, baseTag string) []byte {
	lower := bytes.ToLower(body)
	headIndex := bytes.Index(lower, []byte("<head"))
	if headIndex == -1 {
		return append([]byte(baseTag), body...)
	}

	tagCloseIndex := bytes.IndexByte(lower[headIndex:], '>')
	if tagCloseIndex == -1 {
		return append([]byte(baseTag), body...)
	}

	insertAt := headIndex + tagCloseIndex + 1
	result := make([]byte, 0, len(body)+len(baseTag))
	result = append(result, body[:insertAt]...)
	result = append(result, baseTag...)
	result = append(result, body[insertAt:]...)
	return result
}

func renderProxyError(w http.ResponseWriter, statusCode int, target string, err error) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(statusCode)
	_, _ = fmt.Fprintf(
		w,
		`<html><body style="font-family:sans-serif;padding:40px;color:#666"><h2>无法加载</h2><p>%s</p><p style="font-size:12px;color:#999">%s</p></body></html>`,
		html.EscapeString(err.Error()),
		html.EscapeString(target),
	)
}

func validateDestination(ctx context.Context, targetURL *neturl.URL, allowPrivateNetworks bool) error {
	hostname := targetURL.Hostname()
	if hostname == "" {
		return errors.New("missing host")
	}

	if allowPrivateNetworks {
		return nil
	}

	if strings.EqualFold(hostname, "localhost") {
		return errors.New("localhost is blocked")
	}

	if addr, err := netip.ParseAddr(hostname); err == nil {
		if isPrivateAddr(addr) {
			return errors.New("private network destination is blocked")
		}
		return nil
	}

	ips, err := net.DefaultResolver.LookupIPAddr(ctx, hostname)
	if err != nil {
		return fmt.Errorf("resolve host: %w", err)
	}

	if len(ips) == 0 {
		return errors.New("host resolved to no ip addresses")
	}

	for _, ip := range ips {
		addr, ok := netip.AddrFromSlice(ip.IP)
		if !ok {
			return errors.New("invalid resolved ip address")
		}
		if isPrivateAddr(addr) {
			return errors.New("private network destination is blocked")
		}
	}

	return nil
}

func isPrivateAddr(addr netip.Addr) bool {
	return addr.IsLoopback() ||
		addr.IsPrivate() ||
		addr.IsLinkLocalUnicast() ||
		addr.IsLinkLocalMulticast() ||
		addr.IsMulticast() ||
		addr.IsInterfaceLocalMulticast() ||
		addr.IsUnspecified()
}

func copyHeaders(src http.Header) http.Header {
	dst := make(http.Header, len(src))
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
	return dst
}

func copyResponseHeaders(dst, src http.Header) {
	for key, values := range src {
		for _, value := range values {
			dst.Add(key, value)
		}
	}
}

func removeBlockedHeaders(headers http.Header) {
	headers.Del("X-Frame-Options")
	headers.Del("Content-Security-Policy")
	headers.Del("Content-Security-Policy-Report-Only")
	headers.Del("Content-Encoding")
}
