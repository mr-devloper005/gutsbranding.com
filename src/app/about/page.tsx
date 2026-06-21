import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE_CONFIG } from "@/lib/site-config";

const values = [
  {
    title: "Multi-format publishing",
    description:
      "Publish and browse articles, listings, classifieds, image-led posts, profiles, social bookmarks, and PDF resources in one connected platform.",
  },
  {
    title: "Connected discovery",
    description:
      "Every section links naturally to related content, so visitors can move between formats without losing context.",
  },
  {
    title: "Clean, practical experience",
    description:
      "The interface is built for clarity, fast scanning, and better content exploration across both desktop and mobile.",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      title={`About ${SITE_CONFIG.name}`}
      description={`${SITE_CONFIG.name} is a multi-format publishing platform designed for clear discovery across articles, listings, visuals, profiles, and documents.`}
      actions={
        <Button asChild>
          <Link href="/contact">Contact Us</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <Badge variant="secondary">Our Story</Badge>
            <h2 className="text-2xl font-semibold text-foreground">
              A clearer way to publish and discover content.
            </h2>
            <p className="text-sm text-muted-foreground">
              {SITE_CONFIG.name} brings different content types into a single experience so stories, business pages, announcements, visual posts, and resources stay connected. The goal is simple: make publishing easier and discovery more useful for real visitors.
            </p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {values.map((value) => (
            <Card key={value.title} className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
