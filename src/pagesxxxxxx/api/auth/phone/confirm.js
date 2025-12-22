export const prerender = false

import { getSecret } from 'astro:env/server'
import { supabase } from "$utils/supabase"
import jwt from "jsonwebtoken"


export async function POST(c) {
	try {
		
		const body = await c.request.json()
		const phone = Number(String(body.phone).replace(/\D/g, ''))
		const pin = Number(String(body.pin).replace(/\D/g, ''))
		const fingerprint = c.cookies.get('fingerprint')?.value

		console.log('***** fingerprint:', fingerprint)

		if (phone < 11000000000 || phone > 19990000000)
			throw 'Invalid phone number'

		if (pin < 100000 || pin > 999999)
			throw 'Invalid PIN'

		if (fingerprint?.length < 3)
			throw 'Invalid fingerprint'

		// look for the user
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('phone', phone)
			.single()
		
		// destroy pin and fingerprint
		// await supabase
		// 	.from('users')
		// 	.update({ pin: null, expires: null, fingerprint: null }, { onConflict: 'id' })
		// 	.eq('id', user.id)
		
		if (userError) 
			throw 'Could not find user'
		
		if (user.pin !== pin) 
			throw 'Incorrect PIN'

		if (user.expires < Date.now()) 
			throw 'PIN has expired'

		if (user.fingerprint !== fingerprint) 
			throw 'Invalid fingerprint'

		// create a JWT
		const token = jwt.sign(
			{ id: user.id }, 
			getSecret('JWT_SECRET'), 
			{ expiresIn: '7d' }
		)

		c.cookies.set('token', token, {
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// return a message
		return new Response(
			JSON.stringify({ message: `You are logged in for 7 days` }), {
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