with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('=&gt;', '=>')
html = html.replace('&lt;', '<')
html = html.replace('&gt;', '>')
html = html.replace('&amp;', '&')

# Fix the body tag issue.
# In the JS template it should be:
#                </script>
#            </body>
#            </html>
#            ;

bad_block = """                </script>
</body>
</html>
            ;"""
good_block = """                </script>
            </body>
            </html>
            ;"""
html = html.replace(bad_block, good_block)

# Add closing tags if they are missing at the EOF
if not '</body>\n</html>' in html[-50:]:
    html += '\n</body>\n</html>'

import time
html += f"<!-- v19 {time.time()} -->"
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
