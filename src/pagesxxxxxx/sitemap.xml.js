import { supabase } from '$utils/supabase';

export async function GET({ params, request, locals }) {

	const DOMAIN = `https://barrelguide.com`;
	// const { data: provinces } = await supabase
	// 	.rpc('_provinces', {
	// 		_directory: locals.site.directory,
	// 		_country: ''
	// 	});

	const { data: distilleries } = await supabase
		.from('_distilleries_mat')
		.select('id, slug')
		.eq('country_slug', 'ca')
		.order('score', { ascending: false })
		.limit(100);

	const urls = [`${DOMAIN}/`];

	// provinces?.forEach((place) => {
	// 	urls.push(`${DOMAIN}/${place.country_slug}/${place.province_slug}`);
	// });

	distilleries?.forEach((d) =>
		urls.push(`${DOMAIN}/${d.slug}`)
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': `public, max-age=1800, s-maxage=${3600*12}` // 1 hour = 3600, 30 minutes = 1800, 1 month = 2592000
		},
	});
}
