import { getAdmin, adminCanAccess, getUserById, db, save, emitToAdmins } from "@/lib/db";
import { remote, remoteOn } from "@/lib/remote";

export const dynamic = "force-dynamic";

/* agent saves a customer's display name + downloads a .vcf on the client */
export async function POST(req) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ success: false }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch {}
  const userId = Number(b.userId);
  const name = String(b.name || "").trim().slice(0, 80);
  const user = await getUserById(userId);
  if (!name || !user) return Response.json({ success: false, error: "Bad request" }, { status: 400 });
  if (!adminCanAccess(admin, user)) return Response.json({ success: false, error: "Not your user" }, { status: 403 });
  if (remoteOn) await remote.patchUser(userId, { display_name: name });
  else { user.display_name = name; db.users[userId] = user; save(); }
  emitToAdmins(user, "user", {}); // admin lists refresh
  return Response.json({ success: true, user: { id: user.id, display_name: name } });
}
