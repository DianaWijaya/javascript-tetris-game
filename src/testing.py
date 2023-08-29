import testing
import unittest

class TestSbw(unittest.TestCase):
	def test_case_1(self):
		self.assertEqual(testing.sbw_price("Sub", "6-inch", "Garlic", "Yes", "Standard Veggies", "Meatball"), 11)
    def test_case_2(self):
        self.assertEqual(testing.sbw_price("Sub", "Footlong", "Plain", "No", "Premium", "MLT"), 12)
    def test_case_3(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Wagyu Steak"), 13)

    def test_case_4(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Standard steak"), 12)
    def test_case_5(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Meatball"), 11)
    def test_case_6(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "MLT"), 12)
    def test_case_7(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Wagyu Steak"), 13)
    def test_case_8(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Standard steak"), 12)
    def test_case_9(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Meatball"), 11)
    def test_case_10(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "MLT"), 12)
    def test_case_11(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Wagyu Steak"), 13)
    def test_case_12(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Standard steak"), 12)
    def test_case_13(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Meatball"), 11)
    def test_case_14(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "MLT"), 12)
    def test_case_15(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Wagyu Steak"), 13)
    def test_case_16(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Standard steak"), 12)
    def test_case_17(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Meatball"), 11)
    def test_case_18(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "MLT"), 12)
    def test_case_19(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Wagyu Steak"), 13)
    def test_case_20(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Standard steak"), 12)
    def test_case_21(self):
        self.assertEqual(testing.sbw_price("Wrap", "6-inch", "Plain", "No", "Premium", "Meatball"), 11)


        
unittest.main()
