import { router } from 'expo-router';
import { useCallback } from 'react';
import { environment } from '../app/environments/environment';
/* import { reduxStore } from '../store/store';
import { setAuthToken, setUser } from '../store/AuthSlice'; */

const BACKEND_URL = environment.host;

export function useFetch(): (uri: string, options: RequestInit | undefined) => Promise<Response> {
	return useCallback(async (uri: string, options: RequestInit | undefined) => {
		let response: Response;
		try {
			response = await fetch(`${BACKEND_URL}/api/v1${uri}`, options);
		} catch (error) {
			throw error;
		}
		if (!response.ok) {
			if (
				response.status === 401 &&
				options?.headers &&
				typeof options.headers === 'object' &&
				'x-access-token' in options.headers
			) {
				router.replace("/screens/auth/login");
				/* reduxStore.dispatch(setUser(undefined));
				reduxStore.dispatch(setAuthToken(undefined)); */
			}
		}
		return response;
	}, []);
}
