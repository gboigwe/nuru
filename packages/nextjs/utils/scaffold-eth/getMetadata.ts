import type { Metadata } from "next";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;
const titleTemplate = "%s | Nuru";

export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.jpg",
  themeColor = "#12B76A",
  viewport = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
  themeColor?: string;
  viewport?: string;
}): Metadata => {
  const imageUrl = `${baseUrl}${imageRelativePath}`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: titleTemplate,
    },
    description: description,
    themeColor: themeColor,
    viewport: viewport,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Nuru',
    },
    icons: {
      icon: [
        { url: "/favicon.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/icons/icon-192x192.png",
      apple: "/icons/icon-192x192.png",
    },
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [imageUrl],
    },
  };
};
