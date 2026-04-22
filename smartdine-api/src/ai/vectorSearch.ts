import type { VectorSearchCandidate } from '../types/retrieval.js'

// P2 再实现：当前只保留向量检索接口签名，不接入主链路。
export async function vectorSearch(
  _query: string,
  _limit: number,
): Promise<VectorSearchCandidate[]> {
  return []
}
