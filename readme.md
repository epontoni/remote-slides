# Remote Slides

Remote Slides transforma tu teléfono en un control remoto para tus presentaciones de Google Slides. Ejecutá la app, conectá tu dispositivo móvil y manejá tus diapositivas sin cables, sin interrupciones y sin depender de un clicker tradicional.

## Requisitos

_node-key-sender_
Use this lib [Node Key Sender](https://github.com/garimpeiro-it/node-key-sender) to send keyboard events to the operational system.

It uses a jar file (Java), so Java Run Time is required on the operational system you are running your node project (version 8 or above). ([Descargar Java Run Time](https://www.java.com/en/download/manual.jsp)). Añadir a las variables de entorno `PATH`.

Además, usaremos el tunel de [Cloudflare](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) para compartir nuestro proyecto de manera remota. En windows, lo instalamos mediante el comando:

```bash
https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/
```

Creamos un tunel con el comando

```bash
cloudflared tunnel --url http://localhost:3000
```

Esto lo hace el script `start.bat` por nosotros.

## Iniciar la app

```bash
npm run start
```

o ejecutamos el archivo `start.bat`
