import type { Metadata } from "next";

export type SupportedLocale = "en" | "ar";

type StaticPageKey =
  | "about"
  | "bestSellers"
  | "collections"
  | "contact"
  | "privacy"
  | "products"
  | "projects"
  | "returns"
  | "shipping"
  | "trade"
  | "warranty"
  | "wishlist";

type SeoCopy = {
  title: string;
  description: string;
};

const staticPageCopy: Record<StaticPageKey, Record<SupportedLocale, SeoCopy>> = {
  about: {
    en: {
      title: "About Steinheim | German Bathroom Engineering in Egypt",
      description:
        "Discover Steinheim's German-engineered bathroom systems, coordinated collections, technical standards, and exclusive partnership in Egypt.",
    },
    ar: {
      title: "عن شتاينهايم | هندسة ألمانية للحمامات في مصر",
      description:
        "تعرّف على أنظمة حمامات شتاينهايم المصممة في ألمانيا، ومجموعاتها المتناسقة، ومعاييرها التقنية، وشراكتها الحصرية في مصر.",
    },
  },
  bestSellers: {
    en: {
      title: "Best-Selling Bathroom Fixtures | Steinheim Egypt",
      description:
        "Explore Steinheim Egypt's most requested bathroom mixers, showers, and accessories across coordinated collections and premium finishes.",
    },
    ar: {
      title: "تجهيزات الحمامات الأكثر مبيعًا | شتاينهايم مصر",
      description:
        "استكشف أكثر خلاطات ودُش وإكسسوارات شتاينهايم طلبًا في مصر ضمن مجموعات متناسقة وتشطيبات فاخرة.",
    },
  },
  collections: {
    en: {
      title: "Bathroom Collections | Steinheim Egypt",
      description:
        "Explore Joy, Up, Art, and Quatro—four coordinated Steinheim bathroom collections available in six premium finishes across Egypt.",
    },
    ar: {
      title: "مجموعات الحمامات | شتاينهايم مصر",
      description:
        "استكشف مجموعات شتاينهايم Joy وUp وArt وQuatro المتناسقة والمتاحة بستة تشطيبات فاخرة في مصر.",
    },
  },
  contact: {
    en: {
      title: "Contact Steinheim Egypt | Product & Project Enquiries",
      description:
        "Contact Steinheim Egypt for product availability, technical information, project support, trade enquiries, and purchasing assistance.",
    },
    ar: {
      title: "تواصل مع شتاينهايم مصر | استفسارات المنتجات والمشروعات",
      description:
        "تواصل مع شتاينهايم مصر لمعرفة توافر المنتجات والمعلومات التقنية ودعم المشروعات واستفسارات الشراء والتجارة.",
    },
  },
  privacy: {
    en: {
      title: "Privacy Policy | Steinheim Egypt",
      description:
        "Learn how Steinheim Egypt collects, uses, stores, and protects personal information when you use our website and services.",
    },
    ar: {
      title: "سياسة الخصوصية | شتاينهايم مصر",
      description:
        "تعرّف على كيفية جمع شتاينهايم مصر للمعلومات الشخصية واستخدامها وحفظها وحمايتها عند استخدام موقعنا وخدماتنا.",
    },
  },
  products: {
    en: {
      title: "Bathroom Mixers, Showers & Accessories | Steinheim Egypt",
      description:
        "Browse Steinheim bathroom mixers, shower systems, and accessories by collection, product type, finish, availability, and price.",
    },
    ar: {
      title: "خلاطات ودُش وإكسسوارات الحمامات | شتاينهايم مصر",
      description:
        "تصفح خلاطات وأنظمة الدُش وإكسسوارات شتاينهايم حسب المجموعة والنوع والتشطيب والتوافر والسعر.",
    },
  },
  projects: {
    en: {
      title: "Luxury Residential Project References | Steinheim Egypt",
      description:
        "Explore residential projects specified with Steinheim bathroom systems, coordinated collections, finishes, and technical schedules.",
    },
    ar: {
      title: "مشروعات سكنية فاخرة | شتاينهايم مصر",
      description:
        "استكشف مشروعات سكنية تستخدم أنظمة حمامات شتاينهايم ومجموعاتها وتشطيباتها وجداولها التقنية المتناسقة.",
    },
  },
  returns: {
    en: {
      title: "Returns & Exchange Policy | Steinheim Egypt",
      description:
        "Review return and exchange conditions for Steinheim bathroom fixtures, including eligibility, timeframes, and refund processing.",
    },
    ar: {
      title: "سياسة الاسترجاع والاستبدال | شتاينهايم مصر",
      description:
        "راجع شروط استرجاع واستبدال تجهيزات حمامات شتاينهايم، بما يشمل الأهلية والمواعيد وإجراءات رد المدفوعات.",
    },
  },
  shipping: {
    en: {
      title: "Shipping & Delivery Policy | Steinheim Egypt",
      description:
        "Find delivery areas, shipping costs, processing times, order tracking, and inspection guidance for Steinheim orders in Egypt.",
    },
    ar: {
      title: "سياسة الشحن والتوصيل | شتاينهايم مصر",
      description:
        "تعرّف على مناطق التوصيل وتكاليف الشحن ومدة التجهيز وتتبع الطلب وإرشادات الاستلام لطلبات شتاينهايم في مصر.",
    },
  },
  trade: {
    en: {
      title: "Trade Studio for Architects & Designers | Steinheim Egypt",
      description:
        "Build room schedules, coordinate finishes, request pricing, and manage Steinheim bathroom specifications for residential projects.",
    },
    ar: {
      title: "استوديو المحترفين للمعماريين والمصممين | شتاينهايم مصر",
      description:
        "أنشئ جداول الغرف ونسّق التشطيبات واطلب الأسعار وأدر مواصفات حمامات شتاينهايم للمشروعات السكنية.",
    },
  },
  warranty: {
    en: {
      title: "Bathroom Fixture Warranty | Steinheim Egypt",
      description:
        "Review Steinheim Egypt warranty coverage for cartridges, aerators, chrome, nickel, and PVD bathroom fixture finishes.",
    },
    ar: {
      title: "ضمان تجهيزات الحمامات | شتاينهايم مصر",
      description:
        "راجع تغطية ضمان شتاينهايم مصر للخراطيش والمهويات وتشطيبات الكروم والنيكل وPVD لتجهيزات الحمامات.",
    },
  },
  wishlist: {
    en: {
      title: "Your Wishlist | Steinheim Egypt",
      description: "Review the Steinheim bathroom products and finishes saved on this device.",
    },
    ar: {
      title: "قائمة رغباتك | شتاينهايم مصر",
      description: "راجع منتجات وتشطيبات حمامات شتاينهايم المحفوظة على هذا الجهاز.",
    },
  },
};

export function normalizeLocale(locale: string): SupportedLocale {
  return locale === "ar" ? "ar" : "en";
}

export function localizedAlternates(locale: string, path = ""): Metadata["alternates"] {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedPath = path && path !== "/" ? `/${path.replace(/^\/+|\/+$/g, "")}` : "";

  return {
    canonical: `/${normalizedLocale}${normalizedPath}`,
    languages: {
      en: `/en${normalizedPath}`,
      ar: `/ar${normalizedPath}`,
      "x-default": `/en${normalizedPath}`,
    },
  };
}

export function createLocalizedMetadata({
  locale,
  path,
  title,
  description,
  index = true,
}: {
  locale: string;
  path?: string;
  title: string;
  description: string;
  index?: boolean;
}): Metadata {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedPath = path && path !== "/" ? `/${path.replace(/^\/+|\/+$/g, "")}` : "";
  const canonical = `/${normalizedLocale}${normalizedPath}`;
  const alternates = localizedAlternates(normalizedLocale, path);

  return {
    title,
    description,
    alternates,
    robots: index ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "Steinheim Egypt",
      locale: normalizedLocale === "ar" ? "ar_EG" : "en_US",
      title,
      description,
      url: canonical,
    },
  };
}

export function getStaticPageMetadata(
  locale: string,
  path: string,
  key: StaticPageKey,
  options?: { index?: boolean }
): Metadata {
  const normalizedLocale = normalizeLocale(locale);
  return createLocalizedMetadata({
    locale: normalizedLocale,
    path,
    ...staticPageCopy[key][normalizedLocale],
    index: options?.index,
  });
}
