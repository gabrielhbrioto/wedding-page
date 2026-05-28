-- 11. VIEW DASHBOARD ADMIN
-- =====================================================

create view vw_dashboard as
select
    count(*) as total_grupos,

    count(*) filter (
        where rsvp_status = 'RESPONDIDO'
    ) as grupos_respondidos,

    count(*) filter (
        where rsvp_status = 'PENDENTE'
    ) as grupos_pendentes

from invitation_groups;

-- =====================================================
