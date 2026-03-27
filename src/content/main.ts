import { initMergeMessageTransform } from './merge-message';
import { initConventionalComments } from './conventional-comments';

export function startBitbucketMergeCommitContent(): void {
  initMergeMessageTransform();
  initConventionalComments();
}
