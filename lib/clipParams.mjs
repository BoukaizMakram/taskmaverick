// The query of a demo's /embed page (shown in the Assets Library):
//   ?clip=alerts | instructions:video | all   chapter ids, see useClipSlice
//   &mode=player | preview | still             (default player)
//   &still=0.7                                 how far into the clip a still is
//   &autoplay=1                                a player starts playing right away
export function clipParams(query) {
  const one = value => (Array.isArray(value) ? value[0] : value);
  const clip = String(one(query.clip) ?? '');
  const mode = one(query.mode);
  const still = Number(one(query.still));
  return {
    clip: /^[a-z0-9-]{1,48}(:[a-z0-9-]{1,48})?$/i.test(clip) ? clip : null,
    mode: ['preview', 'still'].includes(mode) ? mode : 'player',
    still: Number.isFinite(still) && still >= 0 && still <= 1 ? still : 0.7,
    autoplay: one(query.autoplay) === '1',
  };
}
