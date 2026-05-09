import { FriendsPanel } from '~features/friends';

export default function FriendsPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-950">Bạn bè</h1>
        <p className="mt-1 text-sm text-gray-500">Danh sách bạn bè Zalo</p>
      </div>
      <FriendsPanel />
    </div>
  );
}
