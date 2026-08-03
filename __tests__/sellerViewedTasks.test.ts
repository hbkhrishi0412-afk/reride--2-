import {
  countActionableSellerTasks,
  getViewedSellerTaskIds,
  markSellerTaskViewed,
  VIEW_DISMISSIBLE_TASK_TYPES,
} from '../utils/sellerViewedTasks';

describe('sellerViewedTasks', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('counts tasks and falls back to pending interest', () => {
    expect(countActionableSellerTasks([], 2)).toBe(2);
    expect(
      countActionableSellerTasks(
        [{ id: 't1', type: 'accept_chat' }, { id: 't2', type: 'respond_offer' }],
        0,
      ),
    ).toBe(2);
  });

  it('excludes viewed dismissible tasks from the badge count', () => {
    expect(VIEW_DISMISSIBLE_TASK_TYPES.has('confirm_test_drive')).toBe(true);
    markSellerTaskViewed('deal_test_drive');
    expect(getViewedSellerTaskIds().has('deal_test_drive')).toBe(true);
    expect(
      countActionableSellerTasks(
        [
          { id: 'deal_test_drive', type: 'confirm_test_drive' },
          { id: 'deal_accept', type: 'accept_chat' },
        ],
        0,
      ),
    ).toBe(1);
  });

  it('does not dismiss action-required tasks on view', () => {
    markSellerTaskViewed('deal_accept');
    expect(
      countActionableSellerTasks([{ id: 'deal_accept', type: 'accept_chat' }], 0),
    ).toBe(1);
  });
});
