'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getMemberAccess,
  grantCourseAccess,
  revokeCourseAccess,
  setMemberPlan,
  setMemberRole,
  type MemberAccess,
} from '@/actions/members';

const selectStyle: React.CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '8px 10px',
  color: 'var(--text)',
  fontSize: 13,
  width: '100%',
};

export default function MemberAccessPanel({
  userId,
  userName,
  onRoleChange,
}: {
  userId: string;
  userName: string;
  onRoleChange?: (role: 'ADMIN' | 'MEMBER') => void;
}) {
  const [access, setAccess] = useState<MemberAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The parent keys this component on userId, so switching members remounts
  // it with fresh state rather than resetting state from inside the effect.
  useEffect(() => {
    let cancelled = false;
    getMemberAccess(userId)
      .then((data) => {
        if (!cancelled) setAccess(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        setAccess(await getMemberAccess(userId));
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  if (error && !access) {
    return <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>;
  }
  if (!access) {
    return <p style={{ color: 'var(--muted)', fontSize: 13 }}>読込中...</p>;
  }

  const enrolled = new Set(access.enrolledCourseIds);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>}

      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
          プラン（手動設定）
        </label>
        <select
          style={selectStyle}
          value={access.planId ?? ''}
          disabled={isPending}
          onChange={(e) => run(() => setMemberPlan(userId, e.target.value || null))}
        >
          <option value="">未契約</option>
          {access.plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          Stripeの課金は変更されません。無料招待やサポート対応で使ってください。
          実際に課金中の会員は、次回のStripe通知で上書きされます。
        </p>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
          ロール
        </label>
        <select
          style={selectStyle}
          value={access.role}
          disabled={isPending}
          onChange={(e) => {
            const role = e.target.value as 'ADMIN' | 'MEMBER';
            if (role === 'ADMIN' && !confirm(`${userName} さんを管理者にしますか？講座・記事・会員・売上設定の全権限を持ちます。`)) return;
            run(async () => {
              await setMemberRole(userId, role);
              onRoleChange?.(role);
            });
          }}
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          講座の個別開放（{enrolled.size} 件）
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.6 }}>
          プラン条件を満たしていなくても、ここで開放した講座は閲覧できます。
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: 8,
          }}
        >
          {access.courses.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--muted)', padding: 4 }}>講座がまだありません。</span>
          ) : (
            access.courses.map((course) => {
              const granted = enrolled.has(course.id);
              return (
                <label
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    padding: '6px 4px',
                    cursor: isPending ? 'default' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={granted}
                    disabled={isPending}
                    onChange={() =>
                      run(() =>
                        granted
                          ? revokeCourseAccess(userId, course.id)
                          : grantCourseAccess(userId, course.id)
                      )
                    }
                  />
                  <span style={{ color: 'var(--text)' }}>
                    {course.number && <span style={{ color: 'var(--muted)' }}>{course.number}. </span>}
                    {course.title}
                  </span>
                  {course.requiredPlanId && (
                    <span style={{ fontSize: 10, color: 'var(--gold-2)', marginLeft: 'auto' }}>プラン限定</span>
                  )}
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
