declare const __RELEASE_SHA__: string | undefined;
export const release = typeof __RELEASE_SHA__ === 'string' ? __RELEASE_SHA__ : 'development';
