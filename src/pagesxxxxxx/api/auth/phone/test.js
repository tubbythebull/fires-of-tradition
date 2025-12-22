export const prerender = false

import { getSecret } from 'astro:env/server'
import jwt from "jsonwebtoken"


export async function GET(c) {
	try {
		
		const token = c.cookies.get('token')?.value

		console.log('***** token:', token)

		if (!token) throw 'Missing token'

		// verify the token
		const decoded = jwt.verify(token, getSecret('JWT_SECRET'))
		if (!decoded) throw 'Invalid token'

		console.log('***** decoded:', decoded)
		
		// return a message
		return new Response(JSON.stringify(decoded), { status: 200 });

	} catch (error) {
		console.log(error);
		return new Response(error.message || error, { status: 400 });
	}
}