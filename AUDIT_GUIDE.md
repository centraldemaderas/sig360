
# Guía de Auditoría y Construcción de Prompt

Como experto auditor de sistemas integrados (ISO 9001, SG-SST, FSC), he analizado la documentación suministrada (Excel). Para llevar esta aplicación a un nivel de producción completo, estas son las **Preguntas Clave** que definen el alcance (Prompt Engineering):

## 1. Lógica de Negocio y Estructura
*   **Jerarquía de Datos:** ¿La estructura siempre es Estándar > Área > Cláusula > Actividad? ¿Existen sub-actividades?
*   **Ponderación:** En el Excel, el cumplimiento parece binario (1 o 0). ¿Desea implementar pesos específicos? (Ej. Una actividad crítica vale el 50% del área).
*   **Recurrencia:** Vemos controles mensuales. ¿Existen controles trimestrales, semestrales o anuales que requieran una visualización diferente en la grilla?

## 2. Gestión de Evidencias (Documental)
*   **Validación:** ¿Quién aprueba el documento subido? ¿Se requiere un flujo de aprobación (Subido -> Revisión -> Aprobado) o la carga es suficiente para marcar "verde"?
*   **Histórico:** ¿Se deben guardar versiones anteriores de los archivos si se rechaza una evidencia?

## 3. Indicadores de Deterioro
*   **Definición:** ¿Cómo se calcula matemáticamente el "deterioro"?
    *   *Propuesta:* (Actividades Vencidas / Actividades Planificadas a la fecha) vs (Histórico del año anterior).

## 4. Roles y Permisos
*   ¿Cada área (ej. Ventas) solo puede ver y editar sus propias actividades, o es un sistema transparente para toda la gerencia?

---

## 🛡️ Protección del Desarrollo (Stability First)
Para asegurar que la IA mantenga el sistema estable:
1.  **Surgical Changes**: Los prompts de actualización deben ser específicos (ej: "Ajusta solo el color del botón X" en lugar de "Rediseña la página").
2.  **Schema Locking**: No modificar `types.ts` a menos que sea estrictamente necesario para la nueva funcionalidad.
3.  **Data Safety**: Siempre verificar que los métodos de `dataService.ts` manejen el fallback a `localStorage` para evitar pérdida de datos en entornos sin internet.
