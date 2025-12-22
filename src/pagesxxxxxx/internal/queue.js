export const prerender = false

import { supabase } from "$utils/supabase"


export async function POST(c) {
	try {

		const body = await c.request.json()

		const { data: insert, error: insertError } = await supabase
			.from('directories_ingest_queue')
			.insert({
				"cid": body.cid,
				"search": body.search,
				"type": body.type
			})

		if (insertError) {
			console.log(insertError);
			throw 'Could not find user. Please try again.';
		}

		// return a message
		return new Response('OK', { status: 200 });


	} catch (error) {
		console.log(error);
		return new Response(error.message || error, { status: 400 });
	}
}