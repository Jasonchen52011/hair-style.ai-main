export type Theme =
  | "light"
  | "dark"
  | "cupcake"
  | "bumblebee"
  | "emerald"
  | "corporate"
  | "synthwave"
  | "retro"
  | "cyberpunk"
  | "valentine"
  | "halloween"
  | "garden"
  | "forest"
  | "aqua"
  | "lofi"
  | "pastel"
  | "fantasy"
  | "wireframe"
  | "black"
  | "luxury"
  | "dracula"
  | "";

export interface ConfigProps {
  appName: string;
  appDescription: string;
  domainName: string;
  crisp: {
    id?: string;
    onlyShowOnRoutes?: string[];
  };
  // Creem 支付配置
  creem: {
    apiKey?: string;
    products: {
      oneTime: {
        id: string;
        name: string;
        price: number;
        credits: number;
        description: string;
        features: string[];
      };
      monthly: {
        id: string;
        name: string;
        price: number;
        credits: number;
        description: string;
        features: string[];
      };
      yearly: {
        id: string;
        name: string;
        price: number;
        credits: number;
        description: string;
        features: string[];
      };
    };
  };
  stripe: {
    plans: {
      isFeatured?: boolean;
      priceId: string;
      name: string;
      description?: string;
      price: number;
      priceAnchor?: number;
      features: {
        name: string;
      }[];
    }[];
  };
  aws?: {
    bucket?: string;
    bucketUrl?: string;
    cdn?: string;
  };
  mailgun: {
    subdomain: string;
    fromNoReply: string;
    fromAdmin: string;
    supportEmail?: string;
    forwardRepliesTo?: string;
  };
  colors: {
    theme: Theme;
    main?: string;
  };
  auth: {
    loginUrl: string;
    callbackUrl: string;
  };
}
