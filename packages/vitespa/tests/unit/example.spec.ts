import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import HelloGarden from '@/components/LayoutFooter.vue';

describe('HelloGarden.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message';
    const wrapper = shallowMount(HelloGarden, {
      props: { msg },
    });
    expect(wrapper.text()).to.include(msg);
  });
});
