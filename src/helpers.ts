export async function wrapMap<K, V>(
	map: Map<K, Promise<V>>
): Promise<Array<{key: K; value: V}>> {
	const wrapped = Array.from(map).map(async (value) => {
		return {
			key: value[0],
			value: await value[1]
		}
	})
	return Promise.all(wrapped)
}
