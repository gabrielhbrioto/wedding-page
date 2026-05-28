-- 12. VIEW CONTAGEM EVENTO
-- =====================================================

create view vw_presence_summary as
select
    count(*) filter (
        where status = 'CERIMONIA_E_JANTAR'
    ) as jantar_confirmados,

    count(*) filter (
        where status = 'SOMENTE_CERIMONIA'
    ) as somente_cerimonia,

    count(*) filter (
        where status = 'AUSENTE'
    ) as ausentes

from rsvp_member_status;

-- =====================================================
-- FIM
