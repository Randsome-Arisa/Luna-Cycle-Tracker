<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

这是用Gemini 3 pro构建的一个生理期记录APP。
# 功能
- 记录经期的起止
- 推理卵泡期、排卵期和黄体期
  目前固定卵泡期7天，排卵期2天，黄体期则持续到下一次月经开始。
- 对应阶段给出不同话语
   推荐话语目前采用本地静态句库。
- 记录想念和sex亲密时刻
   想念使用的紫色爱心色值为#B564E3，接近林俊杰应援色。
  
# TODO
- [ ] ，日后修改为调用AGI API
- [ ] 想念计数可以累加后兑换奖励
- [ ] 优化生理期推理算法

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1eVdZLE_T3f9iHnlsVaQp8Npl_vXFg8Yp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
