/**
 * Минимальная точка входа: первый кадр без React.
 * Показываем "Загрузка..." и подгружаем основное приложение отдельным чанком.
 */
const root = document.getElementById('root')
if (root) {
  root.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;font-size:1rem;">Загрузка приложения...</div>'
}
import('./main')
