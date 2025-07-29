/**
 * 도메인 엔티티의 기본 클래스
 * 모든 엔티티는 이 클래스를 상속받아야 합니다
 */
export abstract class Entity<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = props;
  }

  get id(): string {
    return (this.props as any).id;
  }

  /**
   * 엔티티 동등성 비교
   * ID가 같으면 같은 엔티티로 간주
   */
  equals(entity: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    
    if (this === entity) {
      return true;
    }
    
    return this.id === entity.id;
  }

  /**
   * 엔티티의 속성들을 반환
   */
  toJSON(): T {
    return this.props;
  }
}