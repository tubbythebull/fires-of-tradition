export const prerender = false

import { getSecret } from 'astro:env/server'
import { supabase } from "$utils/supabase"

export async function GET(c) {
	try {

		if (getSecret('MODE') !== 'dev') throw 'Not in dev mode'

		const cid = c.url.searchParams.get('cid')?.trim()
		const extend_only = c.url.searchParams.get('extend_only') ? true : false

		// return new Response(JSON.stringify({cid, onlyExtend}), { status: 200 });

		// check for exisiting record
		const { data: existing, error: existingError } = await supabase
			.from('directories_ingest_queue')
			.select('*')
			.eq('cid', cid)
			.single()

		if (existing) return new Response(JSON.stringify({ message: 'Already in queue' }), { status: 200 });

		// inseert new record
		const { data, error } = await supabase
			.from('directories_ingest_queue')
			.insert([
				{ cid, extend_only, type: 'distillery' }
			])
			.select()
			.single()

		if (error) throw error
		if (!data) throw 'No data returned'

		console.log('referrer:', c.request.headers.get('referer'))

		// return a message
		return c.redirect(c.request.headers.get('referer') || '/', 303)
		// return new Response(null, {
		// 		status: 200,
		// 		headers: { 
		// 			"Content-Type": "application/json",
		// 			"Cache-Control": "no-store, max-age=0",
		// 			"Location": c.request.headers.get('referer') || '/'
		// 			// "Set-Cookie": `fp=${fingerprint}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`  // 15 minutes
		// 		}
		// 	}
		// );

	} catch (error) {
		console.log(error);
		return new Response(error.message || error, { status: 400 });
	}
}