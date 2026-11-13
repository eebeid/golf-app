import { POST as syncPastPost } from '../sync-past/route';

export async function POST(request) {
    // For backwards-compatibility, this endpoint delegates to sync-past with syncPhotos default true
    return syncPastPost(request);
}
