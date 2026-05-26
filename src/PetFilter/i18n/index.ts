// Lightweight i18n. Tone: 19th-c. natural-history field journal —
// understated, italic Latin, no shouting capitals. Only en + zh for v1.

function detectLocale(): 'zh' | 'en' {
  const override = typeof localStorage !== 'undefined'
    ? localStorage.getItem('game_locale')
    : null;
  if (override === 'en' || override === 'zh') return override;
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

const STRINGS = {
  en: {
    brand: 'ALTERU',
    brand_mark: 'natural history society · vol. I',
    plate_header_default: 'Field Station',
    plate_rubric_default: 'genus unknown',
    plate_header_processing: 'Plate — pending',
    plate_header_result: 'Plate',
    plate_header_wall: 'Specimens collected',
    hero_title: 'A Curious Reclassification',
    hero_sub: 'Submit a likeness; the Society will determine your true taxonomic order.',
    upload_label: 'Subject of study',
    upload_cta: 'Submit a likeness',
    upload_replace: 'Replace',
    upload_caption_empty: 'No specimen on file.',
    upload_caption_ready: 'Specimen received.',
    upload_hint: 'A portrait works best — but the Society accepts any honest likeness.',
    pick_heading: 'Select a putative order',
    pick_sub: 'Twelve plates · choose one',
    cat_everyday: 'Familiars',
    cat_wholesome: 'Of gentle disposition',
    cat_uncanny: 'Of curious morphology',
    cta_transfigure: 'Reclassify',
    cta_transfigure_pending: 'Awaiting specimen',
    cta_wall: 'Society archive',
    cta_new_pet: 'Reclassify again',
    cta_back_to_picker: 'Back',
    cta_back_to_wall: 'Return to archive',
    proc_step_reading: 'Measuring the specimen',
    proc_step_morphing: 'Consulting the orders',
    proc_step_rendering: 'Drafting the plate',
    proc_step_settling: 'Affixing the leaf',
    proc_fineprint: 'Do not refresh — engraving in progress.',
    result_subhead: 'The Society has determined this subject to be a',
    result_below_image: 'engraved for the Society archive',
    wall_heading: 'The Society Archive',
    wall_sub: 'Specimens recently catalogued by other naturalists.',
    wall_empty: 'No entries yet. The archive awaits its first plate.',
    wall_back: 'Back',
    scope_my: 'My plates',
    scope_all: 'All plates',
    on_file: 'on file',
    view_list: 'List',
    view_grid: 'Grid',
    err_upload_failed: 'The specimen could not be lodged. Try a smaller likeness.',
    err_gen_failed: 'The engraver was unable to finish. Try another order.',
    hint_tap_play: 'tap to begin',
  },
  zh: {
    brand: 'ALTERU',
    brand_mark: '博物学会 · 卷一',
    plate_header_default: '田野工作站',
    plate_rubric_default: '所属未定',
    plate_header_processing: '图版 — 拟定中',
    plate_header_result: '图版',
    plate_header_wall: '收集到的标本',
    hero_title: '一次奇妙的重新分类',
    hero_sub: '提交一张肖像，学会将判定你真正的分类纲目。',
    upload_label: '研究对象',
    upload_cta: '提交肖像',
    upload_replace: '换一张',
    upload_caption_empty: '尚未登录标本。',
    upload_caption_ready: '标本已收到。',
    upload_hint: '正面像最稳；学会也接受好友、宠物的任何诚实肖像。',
    pick_heading: '挑选拟定的物种',
    pick_sub: '十二图版 · 选其一',
    cat_everyday: '家常之属',
    cat_wholesome: '温良之属',
    cat_uncanny: '奇异之属',
    cta_transfigure: '重新分类',
    cta_transfigure_pending: '待收标本',
    cta_wall: '学会档案',
    cta_new_pet: '再分类一次',
    cta_back_to_picker: '返回',
    cta_back_to_wall: '回档案室',
    proc_step_reading: '测量标本',
    proc_step_morphing: '查阅诸纲目',
    proc_step_rendering: '绘制图版',
    proc_step_settling: '装订书页',
    proc_fineprint: '请勿刷新 — 雕版进行中。',
    result_subhead: '学会判定此对象属于',
    result_below_image: '入档于学会档案',
    wall_heading: '学会档案',
    wall_sub: '其他博物学家近期收录的标本。',
    wall_empty: '还没有人收录。等你来做第一页。',
    wall_back: '返回',
    scope_my: '我的图版',
    scope_all: '全部图版',
    on_file: '在册',
    view_list: '列表',
    view_grid: '网格',
    err_upload_failed: '标本未能登录，换张小一点的肖像。',
    err_gen_failed: '雕版师未能完成，换一物种再试。',
    hint_tap_play: '轻触开始',
  },
} as const;

type StringKey = keyof typeof STRINGS['en'];

const locale = detectLocale();

export function t(key: StringKey): string {
  const v = STRINGS[locale][key];
  return v ?? STRINGS.en[key] ?? key;
}

export function tCategory(cat: 'everyday' | 'wholesome' | 'uncanny'): string {
  switch (cat) {
    case 'everyday': return t('cat_everyday');
    case 'wholesome': return t('cat_wholesome');
    case 'uncanny': return t('cat_uncanny');
  }
}
