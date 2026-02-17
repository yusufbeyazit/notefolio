"""
Portföy Takip - Yerel Sunucu
Statik dosyaları sunar ve Yahoo Finance API isteklerini proxy'ler.
Kullanım: py server.py
Tarayıcıda: http://localhost:5555
"""
 
import http.server
import json
import urllib.request
import urllib.parse
import urllib.error
import ssl
import os
import sys
 
PORT = 5555
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
 
# SSL context that doesn't verify (for Yahoo Finance)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
 
 
class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
 
    def do_GET(self):
        # API endpoint: /api/price?symbol=THYAO
        if self.path.startswith('/api/price'):
            self.handle_price_request()
        else:
            super().do_GET()
 
    def handle_price_request(self):
        # Parse query string
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        symbol = params.get('symbol', [None])[0]
 
        if not symbol:
            self.send_json(400, {'error': 'symbol parametresi gerekli'})
            return
 
        # Add .IS suffix for BIST if not present
        yahoo_symbol = symbol if '.' in symbol else f'{symbol}.IS'
 
        url = f'https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(yahoo_symbol)}?interval=1d&ra…
 
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
                data = json.loads(resp.read().decode('utf-8'))
 
            meta = data.get('chart', {}).get('result', [{}])[0].get('meta', {})
            price = meta.get('regularMarketPrice')
            prev_close = meta.get('chartPreviousClose') or meta.get('previousClose')
            currency = meta.get('currency', 'TRY')
            name = meta.get('shortName', symbol)
 
            if price is not None:
                self.send_json(200, {
                    'symbol': symbol,
                    'price': price,
                    'previousClose': prev_close,
                    'currency': currency,
                    'name': name,
                })
            else:
                self.send_json(404, {'error': f'{symbol} bulunamadı'})
 
        except urllib.error.HTTPError as e:
            self.send_json(e.code, {'error': f'Yahoo Finance hatası: {e.code}'})
        except Exception as e:
            self.send_json(500, {'error': str(e)})
 
    # Batch endpoint: /api/prices?symbols=THYAO,GARAN,ASELS
    def do_POST(self):
        if self.path == '/api/prices':
            self.handle_batch_prices()
        else:
            self.send_json(404, {'error': 'not found'})
 
    def handle_batch_prices(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
 
        try:
            data = json.loads(body)
            symbols = data.get('symbols', [])
        except json.JSONDecodeError:
            self.send_json(400, {'error': 'Geçersiz JSON'})
            return
 
        results = {}
        for symbol in symbols:
            yahoo_symbol = symbol if '.' in symbol else f'{symbol}.IS'
            url = f'https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(yahoo_symbol)}?interval=1d&ra…
 
            try:
                req = urllib.request.Request(url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
                    chart_data = json.loads(resp.read().decode('utf-8'))
 
                meta = chart_data.get('chart', {}).get('result', [{}])[0].get('meta', {})
                price = meta.get('regularMarketPrice')
                prev_close = meta.get('chartPreviousClose') or meta.get('previousClose')
 
                if price is not None:
                    results[symbol] = {
                        'price': price,
                        'previousClose': prev_close,
                        'name': meta.get('shortName', symbol),
                    }
                else:
                    results[symbol] = {'error': 'Fiyat bulunamadı'}
 
            except Exception as e:
                results[symbol] = {'error': str(e)}
 
        self.send_json(200, results)
 
    def send_json(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
 
    # Suppress logging noise
    def log_message(self, format, *args):
        msg = format % args
        if '/api/' in msg:
            sys.stderr.write(f"  API  {msg}\n")
 
 
def main():
    server = http.server.HTTPServer(('127.0.0.1', PORT), PortfolioHandler)
    print(f"""
+------------------------------------------+
|   Portfolio Takip Sunucusu Calisiyor     |
|   http://localhost:{PORT}                  |
|   Durdurmak icin Ctrl+C                 |
+------------------------------------------+
""")
 
    try:
        import webbrowser
        webbrowser.open(f'http://localhost:{PORT}')
    except Exception:
        pass
 
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu durduruldu.")
        server.server_close()
 
 
if __name__ == '__main__':
    main()
