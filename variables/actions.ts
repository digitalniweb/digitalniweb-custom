/**
 * "Action"s can be either user's privileges (to "write") or events which has happened (user "create"d article)
 *
 * Names of actions are in infinitive form even though in logs it means the action has already happened: purchase = purchased etc.
 *
 * These are examples what the "Action"s may refer to (they may refer to multiple things across the applications):
 *
 * @param write can write, read, delete, modify own content (e.g. articles)
 * @param create if user has "write" privilege then when he creates content (e.g. article) the event for logging is called "create"
 * @param read can read other's content (e.g. articles)
 * @param delete can delete other's content (e.g. articles)
 * @param modify can modify/rewrite other's content (e.g. articles)
 * @param register website visitor registered as "user"
 * @param premium "user" upgraded his profile to "premium"
 * @param makeOrder visitor/user made an order
 * @param purchase an order has been successfully completed
 * @param cancel an order has been canceled
 * @param refund an order has been refunded
 * @param pay invoice has been paid
 * @param pending invoice is pending
 * @param expire invoice has expired
 * @param creditAdd credit has been added
 * @param creditSubtract credit has been subtracted
 */
export const actionNames = [
	"write",
	"create",
	"read",
	"delete",
	"modify",
	"register",
	"premium",
	"makeOrder",
	"purchase",
	"cancel",
	"refund",
	"pay",
	"pending",
	"expire",
	"creditAdd",
	"creditSubtract",
] as const;
