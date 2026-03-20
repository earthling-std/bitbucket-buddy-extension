const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { transformMergeMessage } = require("../extension/transform-merge-message.js");

describe("transformMergeMessage", () => {
  it("rewrites default Bitbucket merge message", () => {
    const input =
      "Merged in feat/backstage-init (pull request #47)\n\nbackstage init for learning mobile app\n\n* backstage init for learning mobile app";
    const want =
      "backstage init for learning mobile app (pull request #47)\n\n* backstage init for learning mobile app";
    assert.equal(transformMergeMessage(input), want);
  });

  it("returns null when already transformed (idempotent)", () => {
    const text =
      "backstage init for learning mobile app (pull request #47)\n\n* backstage init for learning mobile app";
    assert.equal(transformMergeMessage(text), null);
  });

  it("returns null when first line does not match", () => {
    assert.equal(transformMergeMessage("feat: something\n\nbody"), null);
  });
});
