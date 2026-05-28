// Milestones in INR — user earns ETH reward on crossing each
const MILESTONES = [1000, 5000, 10000, 25000, 50000];

exports.getMilestones = () => MILESTONES;

exports.checkMilestone = async (user) => {
  const spent = user.totalSpentINR;
  const alreadyClaimed = user.rewardsClaimed.map((r) => r.milestoneIndex);

  for (let i = 0; i < MILESTONES.length; i++) {
    if (spent >= MILESTONES[i] && !alreadyClaimed.includes(i)) {
      // New milestone crossed — frontend will show claim button
      return { unlocked: true, index: i, threshold: MILESTONES[i] };
    }
  }

  return { unlocked: false };
};

exports.getNextMilestone = (totalSpentINR) => {
  for (let i = 0; i < MILESTONES.length; i++) {
    if (totalSpentINR < MILESTONES[i]) {
      return { index: i, threshold: MILESTONES[i], remaining: MILESTONES[i] - totalSpentINR };
    }
  }
  return null; // All milestones crossed
};
