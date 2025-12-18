
# 🛡️ Protocolo de Desarrollo Protegido (IA-Studio)

Este archivo es una guía obligatoria para cualquier ajuste realizado por la IA. El objetivo es mantener la estabilidad del sistema **SIG-Manager Pro**.

## 🏗️ Arquitectura Técnica
1.  **Single Source of Truth**: Los datos siempre pasan por `services/dataService.ts`.
2.  **Tipado Estricto**: Cualquier cambio debe reflejarse en `types.ts`.
3.  **Estilo UI (BLOQUEADO)**: El diseño de los modales de "Información del Requisito" y "Gestión de Evidencia", así como la grilla principal, están **BLOQUEADOS** para coincidir 100% con las capturas de pantalla suministradas por el usuario. 
4.  **Componentes Modulares**: Extraer lógica si supera las 200 líneas.

## 📜 Reglas de Intervención
- **Actualización Mínima**: Solo se modifican las líneas necesarias.
- ** Screenshot Fidelity**: Los cambios visuales en `StandardView.tsx` deben ser validados contra las fotos del usuario. No se permiten cambios de color, disposición o tipografía que se desvíen de ese "blueprint".
- **Manejo de Errores**: Todo proceso asíncrono debe incluir estados de carga y manejo de errores.

## 🛠️ Roadmap de Estabilidad
- [x] Gestión Multi-planta.
- [x] Dashboard de Evidencias Rechazadas.
- [x] Auditoría de Integridad en Settings.
- [x] Sincronización visual con Mockups/Capturas (Nivel Pixel Perfect).
