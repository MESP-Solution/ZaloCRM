import { GroupManagementPanel } from '~features/group-management/components/group-management-panel';

export default function GroupsPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-950">Quản lí nhóm</h1>
        <p className="mt-1 text-sm text-gray-500">Lấy thông tin và thành viên nhóm Zalo từ link</p>
      </div>
      <GroupManagementPanel />
    </div>
  );
}
