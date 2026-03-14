import { TestBed } from '@angular/core/testing';

import { Label } from './label';

describe('Label', () => {
  let service: Label;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Label);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
