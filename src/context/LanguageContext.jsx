import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' }
];

export const TRANSLATIONS = {
  en: {
    // Brand
    brandName: 'RescueRoute',
    brandTagline: "Turn surplus food into someone's next meal",
    
    // Auth & Navigation
    signIn: 'Sign In',
    signOut: 'Sign Out',
    quickSignIn: 'Quick Sign-In (Pre-seeded Accounts)',
    loginDescription: 'Sign in with pre-seeded role credentials or your registered account.',
    foodDonor: 'Food Donor',
    shelterFoodBank: 'Shelters & Food Banks',
    volunteerDriver: 'Volunteer Drivers',
    adminCoordinator: 'Analytics & Impact',
    manageRequests: 'Food Requests',
    publicRequestLink: 'Need food assistance? Submit a Community Request',
    returnToLogin: 'Return to Login',

    // Diets
    dietaryClassification: 'Dietary Classification',
    vegetarian: 'Vegetarian',
    eggetarian: 'Eggetarian',
    nonVegetarian: 'Non-Vegetarian',
    vegan: 'Vegan',
    anyDiet: 'Any / All Diets',
    vegetarianDesc: 'Pure vegetarian — no meat, poultry, fish, or eggs',
    eggetarianDesc: 'Vegetarian diet including eggs',
    nonVegetarianDesc: 'Contains meat, poultry, or seafood',
    veganDesc: '100% plant-based, dairy-free',

    // Actions & Metrics
    createDonation: 'Create Donation',
    donationsList: 'Donations List',
    surplusMatches: 'Surplus Matches',
    activeDeliveries: 'Active Deliveries',
    deliveryHistory: 'Delivery History',
    mealsRescued: 'Meals Rescued',
    surplusDiverted: 'Surplus Diverted',
    co2eAvoided: 'CO2e Avoided',
    organizationsHelped: 'Organizations Helped',
    completedDeliveries: 'Completed Deliveries',
    markPickedUp: 'Mark Picked Up',
    markDelivered: 'Mark Delivered',
    claimDelivery: 'Claim Delivery',
    acceptMatch: 'Accept Match',

    // Status
    posted: 'Posted',
    matched: 'Matched',
    driverAssigned: 'Driver Assigned',
    pickedUp: 'Picked Up',
    delivered: 'Delivered',
    pending: 'Pending',
    approved: 'Approved',
    fulfilled: 'Fulfilled',

    // Map & Requests
    mapTitle: 'City-Wide Rescue Map',
    requestSurplus: 'Request Surplus Food Assistance',
    submitRequest: 'Submit Food Request',
    dropoffLocation: 'Drop-off Location',
    quantityNeeded: 'Quantity Needed',
    urgencyLevel: 'Urgency Level'
  },
  es: {
    // Brand
    brandName: 'RescueRoute',
    brandTagline: 'Convierte el excedente de comida en el plato de alguien',

    // Auth & Navigation
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
    quickSignIn: 'Acceso Rápido (Cuentas de Prueba)',
    loginDescription: 'Inicie sesión con credenciales preconfiguradas o su cuenta.',
    foodDonor: 'Donante de Alimentos',
    shelterFoodBank: 'Refugios y Bancos de Alimentos',
    volunteerDriver: 'Conductores Voluntarios',
    adminCoordinator: 'Análisis e Impacto',
    manageRequests: 'Solicitudes de Alimentos',
    publicRequestLink: '¿Necesita ayuda alimentaria? Envíe una solicitud comunitaria',
    returnToLogin: 'Volver al Inicio de Sesión',

    // Diets
    dietaryClassification: 'Clasificación Dietética',
    vegetarian: 'Vegetariano',
    eggetarian: 'Ovovegetariano',
    nonVegetarian: 'No vegetariano',
    vegan: 'Vegano',
    anyDiet: 'Cualquier Dieta',
    vegetarianDesc: 'Vegetariano puro — sin carne, aves, pescado ni huevos',
    eggetarianDesc: 'Dieta vegetariana que incluye huevos',
    nonVegetarianDesc: 'Contiene carne, aves o mariscos',
    veganDesc: '100% de origen vegetal, sin lácteos',

    // Actions & Metrics
    createDonation: 'Crear Donación',
    donationsList: 'Lista de Donaciones',
    surplusMatches: 'Coincidencias de Excedentes',
    activeDeliveries: 'Entregas Activas',
    deliveryHistory: 'Historial de Entregas',
    mealsRescued: 'Comidas Rescatadas',
    surplusDiverted: 'Excedente Desviado',
    co2eAvoided: 'CO2e Evitado',
    organizationsHelped: 'Organizaciones Ayudadas',
    completedDeliveries: 'Entregas Completadas',
    markPickedUp: 'Marcar Recogido',
    markDelivered: 'Marcar Entregado',
    claimDelivery: 'Reclamar Entrega',
    acceptMatch: 'Aceptar Coincidencia',

    // Status
    posted: 'Publicado',
    matched: 'Emparejado',
    driverAssigned: 'Conductor Asignado',
    pickedUp: 'Recogido',
    delivered: 'Entregado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    fulfilled: 'Cumplido',

    // Map & Requests
    mapTitle: 'Mapa de Rescate de la Ciudad',
    requestSurplus: 'Solicitar Asistencia Alimentaria',
    submitRequest: 'Enviar Solicitud de Comida',
    dropoffLocation: 'Punto de Entrega',
    quantityNeeded: 'Cantidad Necesaria',
    urgencyLevel: 'Nivel de Urgencia'
  },
  hi: {
    // Brand
    brandName: 'RescueRoute',
    brandTagline: 'बचे हुए भोजन को किसी की अगली थाली बनाएं',

    // Auth & Navigation
    signIn: 'लॉग इन करें',
    signOut: 'लॉग आउट',
    quickSignIn: 'त्वरित लॉग-इन (पूर्वनिर्धारित खाते)',
    loginDescription: 'परीक्षण खातों या अपने पंजीकृत खाते से लॉग इन करें।',
    foodDonor: 'भोजन दाता (Donor)',
    shelterFoodBank: 'आश्रय स्थल और फ़ूड बैंक',
    volunteerDriver: 'स्वयंसेवक चालक (Volunteer Driver)',
    adminCoordinator: 'एनालिटिक्स और प्रभाव',
    manageRequests: 'भोजन अनुरोध प्रबंधन',
    publicRequestLink: 'भोजन सहायता चाहिए? सामुदायिक अनुरोध सबमिट करें',
    returnToLogin: 'लॉगिन पर वापस जाएं',

    // Diets
    dietaryClassification: 'आहार वर्गीकरण (Diet Type)',
    vegetarian: 'शाकाहारी (Vegetarian)',
    eggetarian: 'अंडा-युक्त शाकाहारी (Eggetarian)',
    nonVegetarian: 'मांसाहारी (Non-Vegetarian)',
    vegan: 'पूर्ण शाकाहारी (Vegan)',
    anyDiet: 'सभी प्रकार का भोजन',
    vegetarianDesc: 'शुद्ध शाकाहारी — मांस, मछली या अंडा रहित',
    eggetarianDesc: 'अंडा शामिल शाकाहारी आहार',
    nonVegetarianDesc: 'मांस, चिकन या समुद्री भोजन शामिल',
    veganDesc: '100% पादप-आधारित, डेयरी-मुक्त',

    // Actions & Metrics
    createDonation: 'भोजन दान करें',
    donationsList: 'दान की गई सूची',
    surplusMatches: 'उपलब्ध भोजन मैच',
    activeDeliveries: 'सक्रिय डिलीवरी',
    deliveryHistory: 'डिलीवरी इतिहास',
    mealsRescued: 'बचाया गया भोजन (Meals)',
    surplusDiverted: 'कचरे से बचाया गया',
    co2eAvoided: 'CO2e उत्सर्जन की बचत',
    organizationsHelped: 'मदद प्राप्त संस्थाएं',
    completedDeliveries: 'सफल डिलीवरी',
    markPickedUp: 'पिकअप पूर्ण चिह्नित करें',
    markDelivered: 'डिलीवरी पूर्ण चिह्नित करें',
    claimDelivery: 'डिलीवरी स्वीकार करें',
    acceptMatch: 'मैच स्वीकार करें',

    // Status
    posted: 'दर्ज किया गया',
    matched: 'मैच हुआ',
    driverAssigned: 'चालक आवंटित',
    pickedUp: 'उठाया गया',
    delivered: 'पहुंचाया गया',
    pending: 'प्रतीक्षारत',
    approved: 'स्वीकृत',
    fulfilled: 'वितरित',

    // Map & Requests
    mapTitle: 'शहर-व्यापी भोजन बचाव मानचित्र',
    requestSurplus: 'भोजन सहायता के लिए अनुरोध करें',
    submitRequest: 'अनुरोध सबमिट करें',
    dropoffLocation: 'वितरण का स्थान',
    quantityNeeded: 'आवश्यक मात्रा',
    urgencyLevel: 'प्राथमिकता स्तर'
  },
  zh: {
    // Brand
    brandName: 'RescueRoute',
    brandTagline: '将剩余物资转化为温暖餐食',

    // Auth & Navigation
    signIn: '登录系统',
    signOut: '退出登录',
    quickSignIn: '快速登录 (预设演示账户)',
    loginDescription: '使用预置的角色账户或注册账户登录。',
    foodDonor: '食品捐助者',
    shelterFoodBank: '庇护所与食物银行',
    volunteerDriver: '志愿派送司机',
    adminCoordinator: '数据与社会效益',
    manageRequests: '社区救济申请',
    publicRequestLink: '需要食物援助？提交救济申请',
    returnToLogin: '返回登录页面',

    // Diets
    dietaryClassification: '饮食类型分类',
    vegetarian: '素食 (Vegetarian)',
    eggetarian: '蛋素 (Eggetarian)',
    nonVegetarian: '非素食 (Non-Vegetarian)',
    vegan: '纯素 (Vegan)',
    anyDiet: '任何饮食类型',
    vegetarianDesc: '无肉、家禽、海鲜或蛋类',
    eggetarianDesc: '包含蛋类的素食',
    nonVegetarianDesc: '包含肉类、禽肉或海鲜',
    veganDesc: '100%植物原料，无乳制品',

    // Actions & Metrics
    createDonation: '发起食物捐助',
    donationsList: '已捐助列表',
    surplusMatches: '智能匹配推荐',
    activeDeliveries: '进行中运输',
    deliveryHistory: '运输历史记录',
    mealsRescued: '获救餐食总数',
    surplusDiverted: '避免浪费重量',
    co2eAvoided: '碳减排总量',
    organizationsHelped: '受助机构数量',
    completedDeliveries: '已完成派送',
    markPickedUp: '确认已取货',
    markDelivered: '确认已送达',
    claimDelivery: '接单运输',
    acceptMatch: '接收该配对',

    // Status
    posted: '已发布',
    matched: '已匹配',
    driverAssigned: '已指派司机',
    pickedUp: '运输中',
    delivered: '已送达',
    pending: '待处理',
    approved: '已审核',
    fulfilled: '已满足',

    // Map & Requests
    mapTitle: '全市食物拯救调度地图',
    requestSurplus: '申请剩余食物援助',
    submitRequest: '提交食物需求',
    dropoffLocation: '送餐目标地址',
    quantityNeeded: '所需数量',
    urgencyLevel: '紧急程度'
  },
  fr: {
    // Brand
    brandName: 'RescueRoute',
    brandTagline: 'Transformer les surplus en prochains repas',

    // Auth & Navigation
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    quickSignIn: 'Connexion Rapide (Comptes de Test)',
    loginDescription: 'Connectez-vous avec des identifiants préconfigurés ou votre compte.',
    foodDonor: 'Donateur Alimentaire',
    shelterFoodBank: 'Refuges et Banques Alimentaires',
    volunteerDriver: 'Chauffeurs Bénévoles',
    adminCoordinator: 'Analyses et Impact',
    manageRequests: 'Demandes Alimentaires',
    publicRequestLink: "Besoin d'aide alimentaire ? Déposer une demande",
    returnToLogin: 'Retour à la Connexion',

    // Diets
    dietaryClassification: 'Classification Diététique',
    vegetarian: 'Végétarien',
    eggetarian: 'Ovo-végétarien',
    nonVegetarian: 'Non-végétarien',
    vegan: 'Végétalien',
    anyDiet: 'Tout Régime',
    vegetarianDesc: 'Sans viande, volaille, poisson ni œufs',
    eggetarianDesc: 'Régime végétarien incluant les œufs',
    nonVegetarianDesc: 'Contient de la viande, volaille ou fruits de mer',
    veganDesc: '100% végétal, sans produits laitiers',

    // Actions & Metrics
    createDonation: 'Créer un Don',
    donationsList: 'Liste des Dons',
    surplusMatches: 'Correspondances de Surplus',
    activeDeliveries: 'Livraisons Actives',
    deliveryHistory: 'Historique des Livraisons',
    mealsRescued: 'Repas Sauvés',
    surplusDiverted: 'Surplus Détourné',
    co2eAvoided: 'CO2e Évité',
    organizationsHelped: 'Organisations Aidées',
    completedDeliveries: 'Livraisons Complétées',
    markPickedUp: 'Marquer Récupéré',
    markDelivered: 'Marquer Livré',
    claimDelivery: 'Prendre en Charge',
    acceptMatch: 'Accepter le Match',

    // Status
    posted: 'Publié',
    matched: 'Apparié',
    driverAssigned: 'Chauffeur Assigné',
    pickedUp: 'En Transit',
    delivered: 'Livré',
    pending: 'En Attente',
    approved: 'Approuvé',
    fulfilled: 'Satisfait',

    // Map & Requests
    mapTitle: 'Carte des Sauvetages Alimentaires',
    requestSurplus: 'Demander une Aide Alimentaire',
    submitRequest: 'Soumettre la Demande',
    dropoffLocation: 'Lieu de Livraison',
    quantityNeeded: 'Quantité Nécessaire',
    urgencyLevel: "Niveau d'Urgence"
  }
};

export function LanguageProvider({ children }) {
  const currentLang = 'en';

  useEffect(() => {
    try {
      localStorage.removeItem('rescueroute_lang');
    } catch (_) {}
  }, []);

  const setLanguage = () => {};

  const t = (key) => {
    return TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t, supportedLanguages: [{ code: 'en', label: 'English', flag: '🇺🇸' }] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      currentLang: 'en',
      setLanguage: () => {},
      t: (key) => TRANSLATIONS.en[key] || key,
      supportedLanguages: SUPPORTED_LANGUAGES
    };
  }
  return context;
}
