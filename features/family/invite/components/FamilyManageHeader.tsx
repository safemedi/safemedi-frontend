import { FamilyScreenHeader } from "../../family-screen/components/FamilyScreenHeader";

type FamilyManageHeaderProps = {
  onBack?: () => void;
};

export function FamilyManageHeader({ onBack }: FamilyManageHeaderProps) {
  return (
    <FamilyScreenHeader title="가족 관리" subtitle="가족의 건강을 함께 지켜요" onBack={onBack} />
  );
}
