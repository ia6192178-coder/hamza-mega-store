import AdminDesignClient from '@/components/AdminDesignClient';
import { requireAdmin } from '@/lib/admin';
import {
  ensureDesignSchema,
  getDesign,
  getDesignBlocks,
  getSettings,
} from '@/lib/db';
import { publicHeroSlides } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function AdminDesignPage() {
  await requireAdmin();
  // Make sure the design_blocks table exists (in case /api/seed was not
  // run after the update) so this page always works with real ids.
  await ensureDesignSchema();
  const blocks = await getDesignBlocks();
  const design = await getDesign(blocks.map((b) => b.id));
  const settings = await getSettings();
  // Hero slide photos go to the editor as light /api/image URLs (never
  // as base64), so saving the hero only re-uploads a changed photo.
  design.hero = publicHeroSlides(design.hero);
  return (
    <>
      <h1>🎨 Design</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Change how your store looks — colours, hero banner, home page
        sections and your own content blocks. Every change appears on the
        store immediately, no re-deploy needed.
      </p>
      <AdminDesignClient
        initialDesign={design}
        initialBlocks={blocks}
        initialAnnouncement={settings.announcement ?? ''}
      />
    </>
  );
}
