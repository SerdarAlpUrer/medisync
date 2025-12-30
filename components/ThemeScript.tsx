import Script from 'next/script'

export function ThemeScript() {
    return (
        <Script
            id="theme-script"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                    (function() {
                        try {
                            const savedSettings = localStorage.getItem('appSettings');
                            if (savedSettings) {
                                const settings = JSON.parse(savedSettings);
                                if (settings.theme === 'dark') {
                                    document.documentElement.classList.add('dark');
                                }
                                if (settings.compactView) {
                                    document.documentElement.classList.add('compact-view');
                                }
                            }
                        } catch (e) {
                            console.error('Error loading theme:', e);
                        }
                    })();
                `,
            }}
        />
    )
}
