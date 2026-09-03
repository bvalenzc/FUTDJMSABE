import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
/**
 * Dos salidas:
 *  - build normal: PWA instalable, assets separados (dist/)
 *  - build "unico": todo en un solo index.html para publicarlo como link (dist-unico/)
 */
/**
 * En GitHub Pages el juego cuelga de /<repo>/, así que las rutas tienen que ser
 * relativas. BASE_PUBLICA la define el workflow de despliegue.
 */
const BASE = process.env.BASE_PUBLICA ?? '/';
export default defineConfig(({ mode }) => {
    const archivoUnico = mode === 'unico';
    return {
        base: archivoUnico ? './' : BASE,
        plugins: [
            react(),
            ...(archivoUnico
                ? [viteSingleFile()]
                : [
                    VitePWA({
                        registerType: 'autoUpdate',
                        includeAssets: ['icons/apple-touch-icon.png'],
                        manifest: {
                            lang: 'es',
                            name: 'FUTDJM',
                            short_name: 'FUTDJM',
                            description: 'Cartas coleccionables del plantel real de DJM, Liga Flash.',
                            start_url: BASE,
                            scope: BASE,
                            display: 'standalone',
                            orientation: 'portrait',
                            background_color: '#0a0908',
                            theme_color: '#0a0908',
                            icons: [
                                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                                { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                            ],
                        },
                        workbox: {
                            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                        },
                    }),
                ]),
        ],
        build: archivoUnico
            ? { outDir: 'dist-unico', assetsInlineLimit: 100 * 1024 * 1024, cssCodeSplit: false }
            : {},
    };
});
