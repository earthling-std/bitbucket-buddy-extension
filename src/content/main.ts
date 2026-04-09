import { initConventionalComments } from './conventional-comments';
import { initMergeMessageTransform } from './merge-message';
import { initRecentRepoTracking } from './recent-repos';

export function startBitbucketMergeCommitContent(): void {
  initMergeMessageTransform();
  initConventionalComments();
  initRecentRepoTracking();
}
