import {TestBed} from '@angular/core/testing';

import {ValidateTokenResolverService} from './validate-token-resolver.service';

describe('ValidateTokenResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ValidateTokenResolverService = TestBed.get(ValidateTokenResolverService);
    expect(service).toBeTruthy();
  });
});
