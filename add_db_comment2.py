with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

db_comment = '''
    <!-- 
    ========================================================================
    🛑 ÁREA DE BASE DE DATOS (ZONA PARA AÑADIR/QUITAR PROMOCIONES) 🛑
    ========================================================================
    INSTRUCCIONES PARA AGREGAR UN NEGOCIO NUEVO:
    1. Copia desde <article class="immersive-card"> hasta </article>.
    2. Pégalo debajo de otro artículo.
    3. Cambia el enlace de la imagen en: background-image: url('AQUÍ').
    4. Cambia los textos y el número de WhatsApp.
    ========================================================================
    -->
'''

html = html.replace('<main class="immersive-feed">', '<main class="immersive-feed">\n' + db_comment)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
