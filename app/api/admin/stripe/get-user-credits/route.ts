import { respErr, respData } from "@/lib/resp";
import { getUserCredits } from "@/services/creditSupabase";
import { getUserUuid } from "@/services/userSupabase";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    const credits = await getUserCredits(user_uuid);

    return respData(credits);
  } catch (e) {
    console.log("get user credits failed: ", e);
    return respErr("get user credits failed");
  }
}
