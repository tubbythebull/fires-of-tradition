export const prerender = false

import { supabase } from "$utils/supabase"


export async function POST(c) {
	try {

		const body = await c.request.json()
		const phone = Number(String(body.phone).replace(/\D/g, ''))

		if (phone < 11000000000 || phone > 19990000000) {
			throw 'Invalid phone number'
		}

		// look for the user
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('phone', phone)
			.single()

		if (userError) {
			console.log(userError);
			throw 'Could not find user. Please try again.';
		}

		// make a random 6-digit pin
		const pin = Math.floor(100000 + Math.random() * 900000);

		// make a datetime 15 minutes from now
		const expires = Date.now() + 15 * 60 * 1000;

		// make a random fingerprint
		const fingerprint = Math.random().toString(36).substring(2, 15);

		// update the pin in the database
		const { error: pinError } = await supabase
			.from('users')
			.update({ pin, expires, fingerprint }, { onConflict: 'id' })
			.eq('id', user.id)

		if (pinError) {
			console.log(pinError);
			throw 'Could not set login pin. Please try again.';
		}

		c.cookies.set('fingerprint', fingerprint, {
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 15 // 15 mins
		});

		// return a message
		return new Response(
			JSON.stringify({ message: `Login PIN sent to ${phone} (${pin})` }), {
				status: 200,
				headers: { 
					"Content-Type": "application/json",
					"Cache-Control": "no-store, max-age=0",
					// "Set-Cookie": `fp=${fingerprint}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`  // 15 minutes
				}
			}
		);

	} catch (error) {
		console.log(error);
		return new Response(error.message || error, { status: 400 });
	}
}