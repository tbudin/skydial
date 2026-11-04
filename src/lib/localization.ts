import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react'
import type { PickerUnit } from '../astro/picker.js'

export interface PickerMessages {
  scene: string; now: string; clear: string; done: string; required: string; range: string; unavailable: string
  instructions: string; requiredHint: string; readOnlyHint: string; choose: string; date: string; time: string
  controls: string; scroll: string; decrease: string; increase: string; dayPeriod: string
  earth: string; earthPrecision: string; rotateEarth: string; orbit: string; selectOrbit: string
  dayOrbit: string; monthOrbit: string; yearOrbit: string; earlier: string; later: string
  dayHint: string; yearHint: string; loading: string; textures: string; start: string; end: string
  incomplete: string; order: string; duration: string; rangeUnavailable: string
}
export interface PickerLocalization {
  locale?: string
  hourCycle?: 'h12' | 'h23'
  dir?: 'ltr' | 'rtl'
  messages?: Partial<PickerMessages>
  labels?: Partial<Record<PickerUnit, string>>
}
const english: PickerMessages = {
  scene: 'Celestial selection', now: 'Now', clear: 'Clear', done: 'Done', required: 'Choose a value.', range: 'Choose a value within the allowed range.', unavailable: 'This date or time is unavailable.',
  instructions: 'Use arrow keys in each scroll column or the minus and plus buttons. Escape closes the picker.', requiredHint: 'Required. ', readOnlyHint: 'Read only. ', choose: 'Choose a value', date: 'Date', time: 'Time',
  controls: 'Step date and time', scroll: 'Scroll date and time', decrease: 'Decrease', increase: 'Increase', dayPeriod: 'AM/PM',
  earth: 'Earth time picker', earthPrecision: 'Earth drag precision', rotateEarth: 'Rotate Earth to set time', orbit: 'Orbital date picker', selectOrbit: 'Select a date from the orbital scales',
  dayOrbit: 'Day of year on the calendar ring', monthOrbit: 'Month on Earth’s orbit', yearOrbit: 'Year on {planet}’s orbit', earlier: 'Earlier year range', later: 'Later year range',
  dayHint: 'Arrow keys adjust the day or month. Page Up and Down change the month or week. Home and End select the first and last allowed date. Scroll while this ring is focused to fine-tune.',
  yearHint: 'Arrow keys adjust the year. Page Up and Down change ten steps. Home and End select the earliest and latest year. Scroll while this ring is focused to fine-tune.',
  loading: 'Loading the solar system…', textures: 'Some surface textures are unavailable. Plain 3D materials are shown.', start: 'Start', end: 'End',
  incomplete: 'Choose both a start and an end.', order: 'The end must follow the start.', duration: 'Choose a range within the allowed duration.', rangeUnavailable: 'This range includes an unavailable date or time.',
}
type Language = { units: Record<PickerUnit, string>; messages: Partial<PickerMessages> }
const languages: Record<string, Language> = {
  en: { units: { year: 'Year', month: 'Month', day: 'Day', hour: 'Hours', minute: 'Minutes', second: 'Seconds' }, messages: english },
  fr: { units: { year: 'Année', month: 'Mois', day: 'Jour', hour: 'Heures', minute: 'Minutes', second: 'Secondes' }, messages: {
    scene: 'Sélection céleste', now: 'Maintenant', clear: 'Effacer', done: 'Terminer', required: 'Choisissez une valeur.', range: 'Choisissez une valeur dans les limites autorisées.', unavailable: 'Cette date ou heure est indisponible.',
    instructions: 'Utilisez les flèches dans chaque colonne ou les boutons moins et plus. Échap ferme le sélecteur.', requiredHint: 'Obligatoire. ', readOnlyHint: 'Lecture seule. ', choose: 'Choisir une valeur', date: 'Date', time: 'Heure',
    controls: 'Ajuster la date et l’heure', scroll: 'Faire défiler la date et l’heure', decrease: 'Diminuer', increase: 'Augmenter', dayPeriod: 'Période',
    earth: 'Sélecteur d’heure terrestre', earthPrecision: 'Précision du déplacement', rotateEarth: 'Tourner la Terre pour régler l’heure', orbit: 'Sélecteur de date orbital', selectOrbit: 'Choisir une date sur les orbites',
    dayOrbit: 'Jour de l’année sur l’orbite terrestre', monthOrbit: 'Mois sur l’orbite terrestre', yearOrbit: 'Année sur l’orbite de {planet}', earlier: 'Années précédentes', later: 'Années suivantes',
    dayHint: 'Les flèches ajustent le jour ou le mois. Page précédente et suivante changent le mois ou la semaine. Début et Fin choisissent les dates limites.', yearHint: 'Les flèches ajustent l’année. Page précédente et suivante changent dix pas. Début et Fin choisissent les années limites.',
    loading: 'Chargement du système solaire…', textures: 'Certaines textures sont indisponibles. Des surfaces unies sont affichées.', start: 'Début', end: 'Fin', incomplete: 'Choisissez un début et une fin.', order: 'La fin doit suivre le début.', duration: 'Choisissez une durée autorisée.', rangeUnavailable: 'Cette période contient une date ou heure indisponible.',
  } },
  de: { units: { year: 'Jahr', month: 'Monat', day: 'Tag', hour: 'Stunden', minute: 'Minuten', second: 'Sekunden' }, messages: {
    scene: 'Himmlische Auswahl', now: 'Jetzt', clear: 'Löschen', done: 'Fertig', required: 'Wählen Sie einen Wert.', range: 'Wählen Sie einen Wert innerhalb der Grenzen.', unavailable: 'Dieses Datum oder diese Uhrzeit ist nicht verfügbar.',
    instructions: 'Verwenden Sie die Pfeiltasten oder die Minus- und Plus-Tasten. Escape schließt die Auswahl.', requiredHint: 'Erforderlich. ', readOnlyHint: 'Schreibgeschützt. ', choose: 'Wert wählen', date: 'Datum', time: 'Uhrzeit',
    controls: 'Datum und Uhrzeit anpassen', scroll: 'Datum und Uhrzeit durchblättern', decrease: 'Verringern', increase: 'Erhöhen', dayPeriod: 'Tageshälfte', earth: 'Erduhrzeit wählen', earthPrecision: 'Genauigkeit', rotateEarth: 'Erde drehen, um die Uhrzeit einzustellen', orbit: 'Orbitales Datum wählen', selectOrbit: 'Datum auf der Umlaufbahn wählen',
    dayOrbit: 'Tag des Jahres auf der Erdbahn', monthOrbit: 'Monat auf der Erdbahn', yearOrbit: 'Jahr auf der Umlaufbahn von {planet}', earlier: 'Frühere Jahre', later: 'Spätere Jahre', dayHint: 'Pfeiltasten ändern Tag oder Monat. Bild auf und ab ändern Monat oder Woche. Pos1 und Ende wählen die Grenzen.', yearHint: 'Pfeiltasten ändern das Jahr. Bild auf und ab ändern zehn Schritte. Pos1 und Ende wählen die Grenzen.',
    loading: 'Sonnensystem wird geladen…', textures: 'Einige Texturen sind nicht verfügbar. Einfarbige Oberflächen werden angezeigt.', start: 'Beginn', end: 'Ende', incomplete: 'Wählen Sie Beginn und Ende.', order: 'Das Ende muss nach dem Beginn liegen.', duration: 'Wählen Sie eine zulässige Dauer.', rangeUnavailable: 'Dieser Zeitraum enthält ein nicht verfügbares Datum oder eine Uhrzeit.',
  } },
  es: { units: { year: 'Año', month: 'Mes', day: 'Día', hour: 'Horas', minute: 'Minutos', second: 'Segundos' }, messages: {
    scene: 'Selección celeste', now: 'Ahora', clear: 'Borrar', done: 'Listo', required: 'Elige un valor.', range: 'Elige un valor dentro de los límites.', unavailable: 'Esta fecha u hora no está disponible.', instructions: 'Usa las flechas o los botones menos y más. Escape cierra el selector.', requiredHint: 'Obligatorio. ', readOnlyHint: 'Solo lectura. ', choose: 'Elegir un valor', date: 'Fecha', time: 'Hora', controls: 'Ajustar fecha y hora', scroll: 'Desplazar fecha y hora', decrease: 'Disminuir', increase: 'Aumentar', dayPeriod: 'Periodo',
    earth: 'Selector de hora terrestre', earthPrecision: 'Precisión', rotateEarth: 'Girar la Tierra para ajustar la hora', orbit: 'Selector de fecha orbital', selectOrbit: 'Elegir una fecha en las órbitas', dayOrbit: 'Día del año en la órbita terrestre', monthOrbit: 'Mes en la órbita terrestre', yearOrbit: 'Año en la órbita de {planet}', earlier: 'Años anteriores', later: 'Años siguientes', dayHint: 'Las flechas ajustan el día o mes. Re Pág y Av Pág cambian el mes o semana. Inicio y Fin seleccionan los límites.', yearHint: 'Las flechas ajustan el año. Re Pág y Av Pág cambian diez pasos. Inicio y Fin seleccionan los límites.',
    loading: 'Cargando el sistema solar…', textures: 'Algunas texturas no están disponibles. Se muestran superficies lisas.', start: 'Inicio', end: 'Fin', incomplete: 'Elige el inicio y el fin.', order: 'El fin debe ser posterior al inicio.', duration: 'Elige una duración permitida.', rangeUnavailable: 'Este intervalo contiene una fecha u hora no disponible.',
  } },
  ar: { units: { year: 'السنة', month: 'الشهر', day: 'اليوم', hour: 'الساعات', minute: 'الدقائق', second: 'الثواني' }, messages: {
    scene: 'الاختيار السماوي', now: 'الآن', clear: 'مسح', done: 'تم', required: 'اختر قيمة.', range: 'اختر قيمة ضمن الحدود المسموح بها.', unavailable: 'هذا التاريخ أو الوقت غير متاح.', instructions: 'استخدم مفاتيح الأسهم أو زري الناقص والزائد. يغلق مفتاح Escape النافذة.', requiredHint: 'مطلوب. ', readOnlyHint: 'للقراءة فقط. ', choose: 'اختر قيمة', date: 'التاريخ', time: 'الوقت', controls: 'ضبط التاريخ والوقت', scroll: 'تمرير التاريخ والوقت', decrease: 'تقليل', increase: 'زيادة', dayPeriod: 'الفترة',
    earth: 'اختيار وقت الأرض', earthPrecision: 'دقة السحب', rotateEarth: 'أدر الأرض لضبط الوقت', orbit: 'اختيار التاريخ المداري', selectOrbit: 'اختر تاريخًا من المدار', dayOrbit: 'يوم السنة على مدار الأرض', monthOrbit: 'الشهر على مدار الأرض', yearOrbit: 'السنة على مدار {planet}', earlier: 'سنوات سابقة', later: 'سنوات لاحقة', dayHint: 'تضبط الأسهم اليوم أو الشهر. يغير Page Up وPage Down الشهر أو الأسبوع. يختار Home وEnd الحدود.', yearHint: 'تضبط الأسهم السنة. يغير Page Up وPage Down عشر خطوات. يختار Home وEnd الحدود.',
    loading: 'جار تحميل المجموعة الشمسية…', textures: 'بعض الخامات غير متاحة. يتم عرض أسطح بسيطة.', start: 'البداية', end: 'النهاية', incomplete: 'اختر البداية والنهاية.', order: 'يجب أن تأتي النهاية بعد البداية.', duration: 'اختر مدة مسموحًا بها.', rangeUnavailable: 'تتضمن هذه الفترة تاريخًا أو وقتًا غير متاح.',
  } },
}
function defined<T extends object>(values: Partial<T> | undefined): Partial<T> {
  return Object.fromEntries(Object.entries(values ?? {}).filter(([, value]) => value !== undefined)) as Partial<T>
}
export function pickerLocale({ locale = 'en-GB', hourCycle, dir, messages, labels }: PickerLocalization = {}) {
  const language = languages[new Intl.Locale(locale).language] ?? languages.en
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric' })
  const cycle = hourCycle ?? (['h11', 'h12'].includes(format.resolvedOptions().hourCycle ?? '') ? 'h12' : 'h23')
  return { locale, hourCycle: cycle, dir: dir ?? (/^(ar|fa|he|ur|ps|dv)(-|$)/i.test(locale) ? 'rtl' : 'ltr') as 'rtl' | 'ltr', units: { ...language.units, ...defined(labels) }, messages: { ...english, ...language.messages, ...defined(messages) } }
}
type PickerLocale = ReturnType<typeof pickerLocale>
const LocalizationContext = createContext<PickerLocale>(pickerLocale())
export function PickerLocalizationProvider({ children, locale, hourCycle, dir, messages, labels }: PickerLocalization & { children: ReactNode }) {
  const value = useMemo(() => pickerLocale({ locale, hourCycle, dir, messages, labels }), [locale, hourCycle, dir, messages, labels])
  return createElement(LocalizationContext.Provider, { value }, children)
}
export function usePickerLocale() { return useContext(LocalizationContext) }
export function localizedPickerUnits(units: readonly PickerUnit[], locale: string): PickerUnit[] {
  const order = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric', calendar: 'gregory' }).formatToParts(new Date(Date.UTC(2000, 10, 22)))
    .map((part) => part.type).filter((part): part is 'year' | 'month' | 'day' => ['year', 'month', 'day'].includes(part))
  return [...order, 'hour', 'minute', 'second'].filter((unit): unit is PickerUnit => units.includes(unit as PickerUnit))
}
export function localizedPickerValue(time: number, timeZone: string, units: readonly PickerUnit[], options: PickerLocalization, lcd = false) {
  const i18n = pickerLocale(options)
  const format: Intl.DateTimeFormatOptions = { timeZone, calendar: 'gregory', hourCycle: i18n.hourCycle as 'h12' | 'h23', ...(lcd ? { numberingSystem: 'latn' } : {}) }
  for (const unit of units) format[unit] = unit === 'year' ? 'numeric' : '2-digit'
  return new Intl.DateTimeFormat(i18n.locale, format).format(time)
}

/** Accept the locale's decimal digits as well as ASCII from hardware keyboards. */
export function parsePickerInteger(text: string, locale: string): number | null {
  let normalized = text.trim().replace(/[\u200e\u200f\u061c]/g, '')
  const numbers = new Intl.NumberFormat(locale, { useGrouping: false })
  for (let number = 0; number < 10; number++) normalized = normalized.replaceAll(numbers.format(number), String(number))
  return /^\d+$/.test(normalized) ? Number(normalized) : null
}
