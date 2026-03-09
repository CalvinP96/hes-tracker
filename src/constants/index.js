export const STAGES = [
  { id:0, label:"Intake", icon:"📥", color:"#DC2626" },
  { id:1, label:"Schedule", icon:"📅", color:"#E97451" },
  { id:2, label:"Assess", icon:"🔍", color:"#D97706" },
  { id:3, label:"Scope", icon:"📋", color:"#d946ef" },
  { id:4, label:"Approve", icon:"✅", color:"#f43f5e" },
  { id:5, label:"Install", icon:"🏗️", color:"#f97316" },
  { id:6, label:"Post-QC", icon:"📊", color:"#eab308" },
  { id:7, label:"Closeout", icon:"📦", color:"#22c55e" },
];

export const ROLES = [
  { key:"admin", label:"Admin/Ops", icon:"👑", tabs:["info","scheduling","assessment","photos","scope","hvac","install","qaqc","closeout","log"] },
  { key:"scheduler", label:"Scheduler", icon:"📅", tabs:["info","scheduling","log"] },
  { key:"assessor", label:"Assessor", icon:"🔍", tabs:["info","assessment","photos","log"] },
  { key:"scope", label:"Scope/Compliance", icon:"📋", tabs:["info","scope","photos","hvac","install","qaqc","closeout","log"] },
  { key:"installer", label:"Install Crew", icon:"🏗️", tabs:["info","install","photos","closeout","log"] },
  { key:"hvac", label:"HVAC Tech", icon:"🔧", tabs:["hvac"] },
];

export const TAB_META = {
  info:{label:"Info",icon:"📋"}, scheduling:{label:"Schedule",icon:"📅"},
  assessment:{label:"Assess",icon:"🔍"},
  photos:{label:"Photos",icon:"📸"}, scope:{label:"Scope",icon:"✅"},
  install:{label:"Install",icon:"🏗️"}, hvac:{label:"HVAC",icon:"🔧"}, qaqc:{label:"QAQC",icon:"🔎"},
  closeout:{label:"Close",icon:"📦"}, log:{label:"Log",icon:"📝"},
};

export const EE_MEASURES = ["Air Sealing","Duct Sealing","Attic Insulation (0-R11)","Attic Insulation (R12-19)","Basement Wall Insulation","Crawl Space Wall Insulation","Knee Wall Insulation","Floor Insulation Above Crawl","Rim Joist Insulation","Injection Foam Walls","Furnace Replacement","Boiler Replacement","Central AC Replacement","Water Heater Replacement","Furnace Tune-Up","Thermostat","Low-e Storm Windows","EC Motor","AC Cover"];
export const HS_MEASURES = ["CO Detector (Hardwired)","Smoke Detector (Hardwired)","CO/Smoke Combo","Exhaust Fan","Exhaust Fan w/ Light","Exhaust Fan Vent Kit","Door Sweeps","Weather Stripping","Dryer Vent Kit","Flue Repairs","Gas Mechanical Repairs","Mold Remediation","Electrical Issues","Water/Sewage Issues","Asbestos Abatement","Building Permit","Other Repairs"];
export const DOCS = ["Assessment Report","Hazardous Conditions Form","Sub-Contractor Estimates","Final Inspection Form (w/ CAZ)","Photos Complete","Final Invoice (w/ sub invoices)","Customer-Signed Scope of Work","Customer Authorization Form","CSAT Leave-Behind"];

export const PHOTO_SECTIONS = {
  "Home Exterior (Pre)":[{id:"ext_front",l:"Front w/ address",p:"pre"},{id:"ext_damage",l:"Pre-existing damage",p:"pre"},{id:"ext_roof",l:"Roof condition",p:"pre"},{id:"ext_sA",l:"Side A",p:"pre"},{id:"ext_sB",l:"Side B",p:"pre"},{id:"ext_sC",l:"Side C",p:"pre"},{id:"ext_sD",l:"Side D",p:"pre"},{id:"ext_ac",l:"AC Condenser",p:"pre"},{id:"ext_ac_tag",l:"AC Condenser tag",p:"pre"},{id:"ext_vents",l:"Vent terminations",p:"pre"},{id:"ext_gutters",l:"Gutters",p:"pre"}],
  "Attic (Pre)":[{id:"att_pre",l:"Pre insulation (wide)",p:"pre"},{id:"att_bypass",l:"Major bypasses",p:"pre"},{id:"att_baffle",l:"Baffle needs",p:"pre"},{id:"att_exh",l:"Exhaust terminations",p:"pre"},{id:"att_hatch",l:"Hatch",p:"pre"},{id:"att_deck",l:"Roof decking",p:"pre"},{id:"att_dmg",l:"Pre-existing damage",p:"pre"},{id:"att_moist",l:"Moisture/mold",p:"pre"}],
  "Foundation (Pre)":[{id:"fnd_insul",l:"Insulation opps",p:"pre"},{id:"fnd_plumb",l:"Plumbing DI",p:"pre"},{id:"fnd_dmg",l:"Pre-existing damage",p:"pre"},{id:"fnd_frn",l:"FRN w/ venting",p:"pre"},{id:"fnd_hwt",l:"HWT w/ venting",p:"pre"},{id:"fnd_dryer",l:"Dryer vent/cap",p:"pre"},{id:"fnd_moist",l:"Moisture/mold",p:"pre"}],
  "CAZ (Pre)":[{id:"caz_smoke",l:"Smoke/CO detectors",p:"pre"},{id:"caz_dhw",l:"DHW flue + tag",p:"pre"},{id:"caz_furn",l:"Furnace flue + tag",p:"pre"}],
  "Blower Door (Pre)":[{id:"as_setup",l:"BD setup w/ manometer",p:"pre"},{id:"as_pre",l:"Pre CFM50 manometer",p:"pre"},{id:"as_pen",l:"Common penetrations",p:"pre"}],
  "Duct (Pre)":[{id:"ds_pre",l:"Pre-CFM manometer",p:"pre"}],
  "Home Exterior (Post)":[{id:"ext_post_front",l:"Front (post)",p:"post"},{id:"ext_post_vents",l:"Vent terminations (post)",p:"post"},{id:"ext_post_ac",l:"AC Condenser (post)",p:"post"}],
  "Attic (Post)":[{id:"att_post",l:"Post insulation (wide)",p:"post"},{id:"att_post_detail",l:"Insulation detail/depth",p:"post"},{id:"att_post_bypass",l:"Bypasses sealed",p:"post"},{id:"att_post_baffle",l:"Baffles installed",p:"post"},{id:"att_post_hatch",l:"Hatch insulated",p:"post"},{id:"att_post_dam",l:"Fire dams/can lights",p:"post"}],
  "Foundation (Post)":[{id:"fnd_post_insul",l:"Foundation insulation",p:"post"},{id:"fnd_post_rim",l:"Rim joist insulation",p:"post"},{id:"fnd_post_seal",l:"Air sealing",p:"post"}],
  "Air Seal (Post)":[{id:"as_post",l:"Post CFM50 manometer",p:"post"},{id:"as_post_pen",l:"Penetrations sealed",p:"post"},{id:"as_post_detail",l:"Air seal detail",p:"post"}],
  "Duct Seal (Post)":[{id:"ds_mastic",l:"Mastic/tape applied",p:"post"},{id:"ds_post",l:"Post-CFM manometer",p:"post"},{id:"ds_post_detail",l:"Duct seal detail",p:"post"}],
  "CAZ (Post)":[{id:"caz_post_smoke",l:"Smoke/CO detectors (post)",p:"post"},{id:"caz_post_flue",l:"Flue connections (post)",p:"post"},{id:"caz_post_vent",l:"Venting (post)",p:"post"}],
  "ASHRAE Fan (Post)":[{id:"fan_box",l:"Specs box w/ model #",p:"post"},{id:"fan_inst",l:"Fan installed",p:"post"},{id:"fan_sw",l:"Switch",p:"post"},{id:"fan_duct",l:"Fan ducting/termination",p:"post"}],
  "New Products (Post)":[{id:"np_hvac",l:"New HVAC w/ tag",p:"post"},{id:"np_furn",l:"New furnace w/ tag",p:"post"},{id:"np_wh",l:"New WH w/ tag",p:"post"},{id:"np_thermo",l:"Smart thermostat",p:"post"},{id:"np_other",l:"Other new product",p:"post"}],
  "Walls (Post)":[{id:"wall_inject",l:"Injection foam holes",p:"post"},{id:"wall_patch",l:"Patched/finished",p:"post"},{id:"wall_knee",l:"Knee wall insulation",p:"post"}],
  "Misc (Post)":[{id:"misc_post1",l:"Additional photo 1",p:"post"},{id:"misc_post2",l:"Additional photo 2",p:"post"},{id:"misc_post3",l:"Additional photo 3",p:"post"}],
  "HVAC — Furnace":[{id:"hvac_furn_tag",l:"Furnace nameplate/tag",p:"hvac"},{id:"hvac_furn_hx",l:"Heat exchanger",p:"hvac"},{id:"hvac_furn_burner",l:"Burners/flame",p:"hvac"},{id:"hvac_furn_board",l:"Control board",p:"hvac"},{id:"hvac_furn_filter",l:"Filter",p:"hvac"},{id:"hvac_furn_issue",l:"Any issues found",p:"hvac"}],
  "HVAC — Water Heater":[{id:"hvac_wh_tag",l:"WH nameplate/tag",p:"hvac"},{id:"hvac_wh_cond",l:"WH overall condition",p:"hvac"},{id:"hvac_wh_vent",l:"WH venting",p:"hvac"},{id:"hvac_wh_burner",l:"WH burners",p:"hvac"},{id:"hvac_wh_issue",l:"WH any issues",p:"hvac"}],
  "HVAC — A/C":[{id:"hvac_ac_tag",l:"Condenser nameplate/tag",p:"hvac"},{id:"hvac_ac_cond",l:"Condenser condition",p:"hvac"},{id:"hvac_ac_elec",l:"Electrical/disconnect",p:"hvac"},{id:"hvac_ac_line",l:"Line set",p:"hvac"},{id:"hvac_ac_evap",l:"Evaporator coil",p:"hvac"},{id:"hvac_ac_issue",l:"A/C any issues",p:"hvac"}],
  "HVAC — Thermostat":[{id:"hvac_thermo",l:"Thermostat",p:"hvac"}],
  "HVAC Replacement — Before":[{id:"repl_before_equip",l:"Old equipment (before removal)",p:"repl"},{id:"repl_before_tag",l:"Old equipment nameplate",p:"repl"},{id:"repl_before_area",l:"Install area (before)",p:"repl"}],
  "HVAC Replacement — Install":[{id:"repl_new_equip",l:"New equipment installed",p:"repl"},{id:"repl_new_tag",l:"New equipment nameplate/tag",p:"repl"},{id:"repl_new_model",l:"New model/serial label",p:"repl"},{id:"repl_new_vent",l:"Venting/flue connections",p:"repl"},{id:"repl_new_gas",l:"Gas line connections",p:"repl"},{id:"repl_new_elec",l:"Electrical connections",p:"repl"},{id:"repl_new_area",l:"Install area (after)",p:"repl"},{id:"repl_new_thermo",l:"Thermostat/controls",p:"repl"}],
  "HVAC Replacement — Verification":[{id:"repl_permit",l:"Permit/sticker (if applicable)",p:"repl"},{id:"repl_startup",l:"Startup/commissioning readings",p:"repl"},{id:"repl_co_test",l:"CO test after install",p:"repl"},{id:"repl_complete",l:"Completed install overview",p:"repl"}]
};

export const CAZ_ITEMS = [{k:"ambient_co",l:"Ambient CO",r:true,u:"PPM"},{k:"gas_sniff",l:"Gas Sniffing",r:false},{k:"spillage",l:"Spillage Test",r:false},{k:"worst_case",l:"Worst Case Depress.",r:true,u:"PA"},{k:"oven_co",l:"Gas Oven CO",r:true,u:"PPM"},{k:"heat_co",l:"Heating System CO",r:true,u:"PPM"},{k:"wh_co",l:"Water Heater CO",r:true,u:"PPM"},{k:"dryer",l:"Dryer Vented",r:false}];

export const QAQC_SECTIONS = {
  "H&S Combustion":["ASHRAE 62.2 met?","Ambient CO within BPI?","Oven/range CO within BPI?","Heating CO within BPI?","WH CO within BPI?","Heating spillage OK?","WH spillage OK?"],
  "Documentation":["Pre/post photos uploaded?","Pre/post CAZ uploaded?","Fan flow rates uploaded?","Assessment form uploaded?","Post invoice uploaded?"],
  "H&S Misc":["Vapor barrier per BPI?","Exhaust terminations per BPI?","Equipment qty matches?","Professional install?","H&S issues addressed?","H&S issues missed?"],
  "Air Sealing":["Min 20% reduction?","Qty matches invoice?","Proper thermal boundary?","Proper materials?","Professional install?","Proper measures (can lights, fire dam)?","All opps identified?"],
  "Duct Measures":["Pre/post CFM photos?","Program materials in unconditioned?"],
  "Attic Insulation":["Meets standards?","Qty matches?","Proper materials?","Baffles per BPI?","Continuous insulation (hatch)?","Proper boundary?","All opps identified?"],
  "Foundation Insulation":["Meets standards?","Qty matches?","Location matches?","Proper materials?","Professional install?","Proper boundary?","All opps?"],
  "Wall Insulation":["Meets standards?","Qty matches?","Location matches?","Proper type?","Professional install?","Proper boundary?","All opps?"],
  "Thermostats":["All eligible changed?","Smart offered?","Programmable offered?","Correctly installed?"],
  "Customer Interview":["Courteous/respectful?","Errors addressed timely?","Clear communication?","Satisfied with install?","Satisfied with quality?","Satisfied overall?","Would recommend?","Additional comments?"]
};

export const FI_SAFETY = [
  {k:"ambient_co",l:"Ambient carbon monoxide",r:true,u:"PPM"},
  {k:"gas_sniff",l:"Gas Sniffing — all exposed gas lines",yn:true},
  {k:"caz_test",l:"CAZ testing"},
  {k:"spillage",l:"Spillage Test",sub:true},
  {k:"worst_case",l:"Worst Case Depressurization",sub:true,r:true,u:"PA"},
  {k:"oven_co",l:"Gas oven CO level",r:true,u:"PPM"},
  {k:"heat_co",l:"Heating system CO level",r:true,u:"PPM"},
  {k:"wh_co",l:"Water heater CO level",r:true,u:"PPM"},
  {k:"dryer",l:"Is dryer properly vented to outside?",yn:true},
  {k:"combust_vent",l:"Are combustion appliances properly vented to the outside?",yn:true}
];
export const FI_INSUL = [
  {k:"walls",l:"Walls",q:"Were walls insulated?"},
  {k:"attic",l:"Attic",q:"Was attic(s) insulated?"},
  {k:"foundation",l:"Foundation Walls (Basement/Crawlspace)",q:"Were walls insulated?"},
  {k:"rim",l:"Rim Joist",q:"Was rim joist insulated?"}
];
export const FI_CONTRACTOR_CK = [
  "Upload energy audit document to the Data Collection Tool",
  "Upload invoice to the Data Collection Tool",
  "Upload final inspection form to the Data Collection Tool",
  "Upload project pictures, or link to pictures, to the Data Collection Tool"
];

// ═══════════════════════════════════════════════════════════════
// PROGRAM RULES — HES Retrofits 2026
// ═══════════════════════════════════════════════════════════════
export const PROGRAM = {
  // Insulation targets
  attic: { threshold: 19, target: 49, label: "Attic insulation when existing ≤R19 → bring to R-49" },
  collar: { threshold: 19, target: 49, label: "Collar beam → R-49" },
  outerCeiling: { threshold: 19, target: 49, label: "Outer ceiling joists → R-49" },
  kneeWall: { threshold: 0, target: 20, label: "Knee wall → R-13+5 or R-20 (min R-11)" },
  extWall1: { threshold: 0, target: 13, label: "Exterior walls → dense pack when possible" },
  extWall2: { threshold: 0, target: 13, label: "Exterior walls 2nd floor → dense pack when possible" },
  fnd: { threshold: 0, target: 10, label: "Basement/crawl wall → min R-10/13" },
  rimJoist: { threshold: 0, target: 10, label: "Rim joist → min R-10" },
  floorAboveCrawl: { threshold: 0, target: 20, label: "Floor above crawl → min R-20" },
  crawlCeiling: { threshold: 0, target: 30, label: "Crawlspace ceiling → R-30" },
  // Mechanical thresholds
  furnaceMinAFUE: 95,
  boilerMinAFUE: 95,
  dhwMinEF: 0.67,
  furnaceRepairCap: 950,
  dhwRepairCap: 650,
  airSealGoal: 25, // % reduction
  airSealMinCFM50pct: 1.1, // ≥110% of sqft
  fanMinCFM: 15, // Qfan below this = no fan needed
  // DHW efficiency by type (fuel + system → avg efficiency %)
  dhwEff: {
    "Natural Gas|Storage Tank": 60,
    "Natural Gas|On Demand": 82,
    "Electric|Storage Tank": 95,
    "Electric|On Demand": 99,
    "Electric|Heat Pump": 300,
    "Propane|Storage Tank": 60,
    "Propane|On Demand": 82,
    "Natural Gas|Indirect": 80,
    "Electric|Indirect": 90,
  },
};

export const DEFAULT_USERS = [
  { id:"u1", name:"Admin", username:"admin", pin:"1234", role:"admin" },
  { id:"u2", name:"Scheduler", username:"scheduler", pin:"1234", role:"scheduler" },
  { id:"u3", name:"Assessor", username:"assessor", pin:"1234", role:"assessor" },
  { id:"u4", name:"Scope Lead", username:"scope", pin:"1234", role:"scope" },
  { id:"u5", name:"Installer", username:"installer", pin:"1234", role:"installer" },
  { id:"u6", name:"HVAC Tech", username:"hvac", pin:"1234", role:"hvac" },
];

export const HVAC_BRANDS = ["","Carrier","Lennox","Trane","Goodman","Rheem","Bryant","York","Amana","Coleman","Ruud","Daikin","Heil","Payne","Tempstar","Comfortmaker","American Standard","Other"];
export const COND_OPTS = ["","Good — no issues","Fair — minor wear","Poor — significant wear","Needs repair","Needs replacement","N/A"];
export const YN_OPTS = ["","Yes","No","N/A"];

export const HVAC_GUIDES = {
  furnace: {
    title:"🔥 Furnace Tune-Up Guide",
    tips:[
      "Check heat exchanger for cracks — shine flashlight through burner ports and look for light on the other side",
      "Listen to inducer motor for 10+ seconds — any grinding, rattling, or vibration = flag it",
      "OHM reading on ignitor: silicon nitride 10-200Ω is normal, silicon carbide 40-90Ω is normal. Outside range = failing",
      "Blue/even flame = good. Yellow/orange/lifting/rolling = bad burners or cracked HX",
      "Flame sensor: clean with fine steel wool or emery cloth. Microamp reading should be 2-6μA",
      "ALWAYS check for CO at register with combustion analyzer after tune-up"
    ]
  },
  waterHeater: {
    title:"🚿 Water Heater Check-Up Guide",
    tips:[
      "Check for rust/water stains at base — indicates tank leaking internally",
      "Venting: look for corrosion, disconnected joints, proper pitch (¼″ per foot upward)",
      "Look for white residue around T&P valve — indicates relief valve has been releasing",
      "Check flue draft with match/lighter near draft hood after 5 min of operation",
      "Sediment: flush a few gallons from drain valve into bucket — if heavy sediment, flag it",
      "Water heater age over 12 years = flag for replacement consideration"
    ]
  },
  condenser: {
    title:"❄️ A/C Tune-Up Guide",
    tips:[
      "Clean condenser coils with garden hose from INSIDE out — never pressure wash",
      "Check disconnect for burn marks, corrosion, or loose connections",
      "Contactor: check for pitting on contact points. Chattering = replace",
      "Check capacitor for bulging top — bulged = failing",
      "Refrigerant: check pressures against manufacturer specs for current outdoor temp",
      "Line set: check insulation on suction line (larger line). Missing insulation = efficiency loss",
      "Listen for compressor noise — grinding/knocking = compressor failing"
    ]
  },
  replacement: {
    title:"🔄 When to Recommend Replacement",
    tips:[
      "Furnace: age 15+ years, cracked heat exchanger, AFUE < 80%, repeated repairs",
      "A/C: age 12+ years, R-22 refrigerant, compressor failure, SEER < 13",
      "Water heater: age 12+ years, tank leaking, heavy sediment, repeated pilot issues",
      "ALWAYS document current condition with photos BEFORE recommending replacement",
      "If recommending replacement, note the existing equipment info (make/model/serial) for scope team",
      "Flag for replacement in the Findings section — Scope team handles the rest"
    ]
  }
};