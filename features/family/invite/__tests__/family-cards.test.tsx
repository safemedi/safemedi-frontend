import { fireEvent, render } from "@testing-library/react-native";
import { FamilyMedicationScheduleCard } from "../../family-screen/components/FamilyMedicationScheduleCard";
import { FamilyInviteCard } from "../components/FamilyInviteCard";
import { FamilyMemberCard } from "../components/FamilyMemberCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    XStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("family cards", () => {
  it("FamilyMedicationScheduleCard는 상태에 따라 완료/대기 뱃지를 표시한다", () => {
    const { getByText, rerender } = render(
      <FamilyMedicationScheduleCard
        schedule={
          { medicineName: "타이레놀", scheduledTime: "08:00", status: "COMPLETED" } as never
        }
      />,
    );
    expect(getByText("완료")).toBeTruthy();

    rerender(
      <FamilyMedicationScheduleCard
        schedule={{ medicineName: "타이레놀", scheduledTime: "08:00", status: "PENDING" } as never}
      />,
    );
    expect(getByText("대기")).toBeTruthy();
  });

  it("FamilyInviteCard는 링크가 없으면 액션 버튼이 비활성화된다", () => {
    const onCopyLink = jest.fn();
    const onShareLink = jest.fn();
    const { getByText } = render(
      <FamilyInviteCard inviteLink=" " onCopyLink={onCopyLink} onShareLink={onShareLink} />,
    );

    fireEvent.press(getByText("링크 복사"));
    fireEvent.press(getByText("공유하기"));
    expect(onCopyLink).not.toHaveBeenCalled();
    expect(onShareLink).not.toHaveBeenCalled();
  });

  it("FamilyInviteCard는 링크가 있으면 액션 버튼이 동작한다", () => {
    const onCopyLink = jest.fn();
    const onShareLink = jest.fn();
    const { getByText } = render(
      <FamilyInviteCard
        inviteLink="https://invite"
        onCopyLink={onCopyLink}
        onShareLink={onShareLink}
      />,
    );

    fireEvent.press(getByText("링크 복사"));
    fireEvent.press(getByText("공유하기"));
    expect(onCopyLink).toHaveBeenCalled();
    expect(onShareLink).toHaveBeenCalled();
  });

  it("FamilyInviteCard는 핸들러가 없어도 링크가 있으면 기본 동작으로 안전하게 처리한다", () => {
    const { getByText } = render(<FamilyInviteCard inviteLink="https://invite" />);

    fireEvent.press(getByText("링크 복사"));
    fireEvent.press(getByText("공유하기"));

    expect(getByText("초대 링크 공유")).toBeTruthy();
  });

  const noop = () => {};
  const baseMemberCardProps = {
    isEditing: false,
    relationDraft: "",
    canSaveRelation: false,
    isSavingRelation: false,
    isUnlinking: false,
    onChangeRelationDraft: noop,
    onStartEdit: noop,
    onCancelEdit: noop,
    onSaveRelation: noop,
    onUnlink: noop,
  };

  it("FamilyMemberCard는 본인 항목에만 본인 뱃지를 표시하고 액션 버튼은 숨긴다", () => {
    const { getAllByText, queryByText, queryByLabelText, rerender } = render(
      <FamilyMemberCard
        member={{ familyId: null, name: "홍길동", relation: "본인" }}
        {...baseMemberCardProps}
      />,
    );
    expect(getAllByText("본인")).toHaveLength(2);
    expect(queryByLabelText("홍길동 호칭 수정")).toBeNull();

    rerender(
      <FamilyMemberCard
        member={{ familyId: 2, name: "김영희", relation: "어머니" }}
        {...baseMemberCardProps}
      />,
    );
    expect(queryByText("본인")).toBeNull();
  });

  it("FamilyMemberCard는 본인이 아닌 항목에 호칭 수정/연동 해제 버튼을 표시한다", () => {
    const onStartEdit = jest.fn();
    const onUnlink = jest.fn();
    const { getByLabelText } = render(
      <FamilyMemberCard
        member={{ familyId: 2, name: "김영희", relation: "어머니" }}
        {...baseMemberCardProps}
        onStartEdit={onStartEdit}
        onUnlink={onUnlink}
      />,
    );

    fireEvent.press(getByLabelText("김영희 호칭 수정"));
    expect(onStartEdit).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText("김영희 가족 연동 해제"));
    expect(onUnlink).toHaveBeenCalledTimes(1);
  });

  it("FamilyMemberCard는 편집 중이면 입력창과 저장/취소 버튼을 보여준다", () => {
    const onChangeRelationDraft = jest.fn();
    const onSaveRelation = jest.fn();
    const onCancelEdit = jest.fn();
    const { getByLabelText } = render(
      <FamilyMemberCard
        member={{ familyId: 2, name: "김영희", relation: "어머니" }}
        {...baseMemberCardProps}
        isEditing
        relationDraft="새 호칭"
        canSaveRelation
        onChangeRelationDraft={onChangeRelationDraft}
        onSaveRelation={onSaveRelation}
        onCancelEdit={onCancelEdit}
      />,
    );

    fireEvent.changeText(getByLabelText("김영희 호칭 입력"), "엄마");
    expect(onChangeRelationDraft).toHaveBeenCalledWith("엄마");

    fireEvent.press(getByLabelText("김영희 호칭 저장"));
    expect(onSaveRelation).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText("김영희 호칭 수정 취소"));
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it("FamilyMemberCard는 저장 불가 상태이면 저장 버튼이 동작하지 않는다", () => {
    const onSaveRelation = jest.fn();
    const { getByLabelText } = render(
      <FamilyMemberCard
        member={{ familyId: 2, name: "김영희", relation: "어머니" }}
        {...baseMemberCardProps}
        isEditing
        relationDraft="어머니"
        canSaveRelation={false}
        onSaveRelation={onSaveRelation}
      />,
    );

    fireEvent.press(getByLabelText("김영희 호칭 저장"));
    expect(onSaveRelation).not.toHaveBeenCalled();
  });
});
